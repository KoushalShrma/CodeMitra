import { normalizeOutput } from './performanceEvaluator.js';

const RESULT_MARKER = '__CODEMITRA_RESULT__';

export const languageConfig = {
  javascript: { id: 63, label: 'JavaScript', editorLanguage: 'javascript' },
  python: { id: 71, label: 'Python', editorLanguage: 'python' },
  cpp: { id: 54, label: 'C++', editorLanguage: 'cpp' },
  java: { id: 62, label: 'Java', editorLanguage: 'java' },
};

function splitInputArguments(input) {
  const value = String(input || '').trim();
  if (!value) {
    return [];
  }

  const args = [];
  let current = '';
  let depth = 0;
  let quote = null;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const previous = value[index - 1];

    if (quote) {
      current += char;
      if (char === quote && previous !== '\\') {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }

    if (char === '[' || char === '{' || char === '(') {
      depth += 1;
      current += char;
      continue;
    }

    if (char === ']' || char === '}' || char === ')') {
      depth -= 1;
      current += char;
      continue;
    }

    if (char === ',' && depth === 0) {
      args.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

function parseLiteral(text) {
  const trimmed = String(text || '').trim();

  if (!trimmed) {
    return '';
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall through to relaxed parsing rules.
  }

  const sanitized = trimmed
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
    .replace(/'/g, '"');

  try {
    return JSON.parse(sanitized);
  } catch {
    // Fall through to heuristic parsing.
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  if (/^(true|false)$/i.test(trimmed)) {
    return trimmed.toLowerCase() === 'true';
  }

  return trimmed;
}

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  return String(value);
}

function escapeJavaString(value) {
  return JSON.stringify(String(value)).replace(/\u2028|\u2029/g, '');
}

function toPythonLiteral(value) {
  return stableSerialize(value);
}

function toJavaScriptLiteral(value) {
  const trimmed = String(value ?? '').trim();

  if (!trimmed) {
    return '""';
  }

  if (
    /^-?\d+(\.\d+)?$/.test(trimmed) ||
    /^(true|false|null|undefined)$/i.test(trimmed) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed;
  }

  return JSON.stringify(trimmed);
}

function toCppLiteral(value, type) {
  if (type === 'int') {
    return String(Number(value));
  }
  if (type === 'string') {
    return escapeJavaString(value);
  }
  if (type === 'charArray') {
    return `{${value.map((item) => escapeJavaString(item)).join(', ')}}`;
  }
  if (type === 'intArray') {
    return `{${value.join(', ')}}`;
  }
  if (type === 'intMatrix') {
    return `{${value.map((row) => `{${row.join(', ')}}`).join(', ')}}`;
  }

  throw new Error(`Unsupported C++ parameter type: ${type}`);
}

function toJavaLiteral(value, type) {
  if (type === 'int') {
    return String(Number(value));
  }
  if (type === 'string') {
    return escapeJavaString(value);
  }
  if (type === 'charArray') {
    return `new char[]{${value.map((item) => `'${String(item).replace(/'/g, "\\'")}'`).join(', ')}}`;
  }
  if (type === 'intArray') {
    return `new int[]{${value.join(', ')}}`;
  }
  if (type === 'intMatrix') {
    return `new int[][]{${value.map((row) => `new int[]{${row.join(', ')}}`).join(', ')}}`;
  }

  throw new Error(`Unsupported Java parameter type: ${type}`);
}

function inferParamType(value) {
  if (typeof value === 'number') {
    return 'int';
  }

  if (typeof value === 'string') {
    return 'string';
  }

  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === 'number')) {
      return 'intArray';
    }

    if (
      value.every(
        (item) => Array.isArray(item) && item.every((nested) => typeof nested === 'number')
      )
    ) {
      return 'intMatrix';
    }

    if (value.every((item) => typeof item === 'string')) {
      return 'charArray';
    }
  }

  return 'string';
}

function convertArgument(argument, type, language) {
  const parsed = parseLiteral(argument);
  const resolvedType = type || inferParamType(parsed);

  if (resolvedType === 'treeLevelOrder') {
    throw new Error('Automated evaluation is not configured for tree-based problems yet.');
  }

  if (language === 'javascript') {
    return toJavaScriptLiteral(argument);
  }

  if (language === 'python') {
    return toPythonLiteral(parsed);
  }

  if (language === 'java') {
    return toJavaLiteral(parsed, resolvedType);
  }

  if (language === 'cpp') {
    return toCppLiteral(parsed, resolvedType);
  }

  throw new Error(`Unsupported language: ${language}`);
}

function buildInvocationArguments({ input, paramTypes = [], language }) {
  const rawArgs = splitInputArguments(input);

  if (paramTypes.length && rawArgs.length !== paramTypes.length) {
    throw new Error('Test case input does not match the expected function signature.');
  }

  return rawArgs.map((argument, index) => convertArgument(argument, paramTypes[index], language));
}

function buildJavaScriptWrapper({ userCode, functionName, testCases, paramTypes }) {
  const calls = testCases
    .map((testCase) => {
      const args = buildInvocationArguments({
        input: testCase.input,
        paramTypes,
        language: 'javascript',
      }).join(', ');

      return `results.push(${JSON.stringify(RESULT_MARKER)} + JSON.stringify(${functionName}(${args})));`;
    })
    .join('\n');

  return `${String(userCode || '').trim()}

const results = [];
${calls}
console.log(results.join("\\n"));
`;
}

function buildPythonWrapper({ userCode, functionName, testCases, paramTypes }) {
  const calls = testCases
    .map((testCase) => {
      const args = buildInvocationArguments({
        input: testCase.input,
        paramTypes,
        language: 'python',
      }).join(', ');

      return `print(${JSON.stringify(RESULT_MARKER)} + json.dumps(${functionName}(${args}), separators=(",", ":")))`;
    })
    .join('\n');

  return `import json

${String(userCode || '').trim()}

${calls}
`;
}

function buildJavaWrapper({ userCode, functionName, testCases, paramTypes }) {
  const calls = testCases
    .map((testCase) => {
      const args = buildInvocationArguments({
        input: testCase.input,
        paramTypes,
        language: 'java',
      }).join(', ');

      return `System.out.println(${JSON.stringify(RESULT_MARKER)} + toJson(${functionName}(${args})));`;
    })
    .join('\n    ');

  return `import java.util.*;

public class Main {
  ${String(userCode || '')
    .trim()
    .replace(/\n/g, '\n  ')}

  private static String toJson(Object value) {
    if (value == null) {
      return "null";
    }
    if (value instanceof String) {
      return "\\""+ value.toString().replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"") + "\\"";
    }
    if (value instanceof Boolean || value instanceof Number) {
      return String.valueOf(value).toLowerCase();
    }
    if (value instanceof int[]) {
      return Arrays.toString((int[]) value).replace(" ", "");
    }
    if (value instanceof char[]) {
      char[] chars = (char[]) value;
      String[] items = new String[chars.length];
      for (int i = 0; i < chars.length; i++) {
        items[i] = "\\""+ chars[i] + "\\"";
      }
      return "[" + String.join(",", items) + "]";
    }
    if (value instanceof int[][]) {
      int[][] matrix = (int[][]) value;
      String[] rows = new String[matrix.length];
      for (int i = 0; i < matrix.length; i++) {
        rows[i] = Arrays.toString(matrix[i]).replace(" ", "");
      }
      return "[" + String.join(",", rows) + "]";
    }
    if (value instanceof List<?>) {
      List<?> list = (List<?>) value;
      String[] items = new String[list.size()];
      for (int i = 0; i < list.size(); i++) {
        items[i] = toJson(list.get(i));
      }
      return "[" + String.join(",", items) + "]";
    }
    return String.valueOf(value);
  }

  public static void main(String[] args) {
    ${calls}
  }
}
`;
}

function buildCppWrapper({ userCode, functionName, testCases, paramTypes }) {
  const calls = testCases
    .map((testCase, index) => {
      const args = buildInvocationArguments({
        input: testCase.input,
        paramTypes,
        language: 'cpp',
      });

      const declarations = args
        .map((argument, argIndex) => {
          const type = paramTypes[argIndex];

          if (type === 'int') {
            return `auto arg_${index}_${argIndex} = ${argument};`;
          }
          if (type === 'string') {
            return `string arg_${index}_${argIndex} = ${argument};`;
          }
          if (type === 'charArray') {
            return `vector<string> arg_${index}_${argIndex} = ${argument};`;
          }
          if (type === 'intArray') {
            return `vector<int> arg_${index}_${argIndex} = ${argument};`;
          }
          if (type === 'intMatrix') {
            return `vector<vector<int>> arg_${index}_${argIndex} = ${argument};`;
          }

          throw new Error(`Unsupported C++ parameter type: ${type}`);
        })
        .join('\n  ');

      const invocationArgs = args
        .map((_argument, argIndex) => `arg_${index}_${argIndex}`)
        .join(', ');

      return `${declarations}
  cout << "${RESULT_MARKER}" << toJson(${functionName}(${invocationArgs})) << "\\n";`;
    })
    .join('\n\n  ');

  return `#include <bits/stdc++.h>
using namespace std;

${String(userCode || '').trim()}

string toJson(const string& value) {
  return "\\""+ value + "\\"";
}

string toJson(const char* value) {
  return "\\""+ string(value) + "\\"";
}

string toJson(bool value) {
  return value ? "true" : "false";
}

template <typename T>
string toJson(const vector<T>& values) {
  string result = "[";
  for (size_t i = 0; i < values.size(); ++i) {
    if (i > 0) {
      result += ",";
    }
    result += toJson(values[i]);
  }
  result += "]";
  return result;
}

template <typename T>
typename enable_if<is_arithmetic<T>::value, string>::type toJson(T value) {
  return to_string(value);
}

int main() {
  ${calls}
  return 0;
}
`;
}

function normalizeOutputValue(value) {
  const normalized = String(value ?? '').trim();
  return normalized || 'undefined';
}

function getVerdict(passed, total) {
  if (passed === total) {
    return 'Great';
  }
  if (passed === 0) {
    return 'Blunder';
  }
  return 'Mistake';
}

export function generateWrappedCode(
  userCode,
  functionName,
  testCases = [],
  language = 'javascript',
  paramTypes = []
) {
  const normalizedLanguage = String(language || '').toLowerCase();
  const trimmedUserCode = String(userCode || '').trim();
  const trimmedFunctionName = String(functionName || '').trim();

  if (!trimmedUserCode) {
    throw new Error('User code is required.');
  }

  if (!trimmedFunctionName) {
    throw new Error('Function name is required.');
  }

  if (!Array.isArray(testCases) || testCases.length === 0) {
    throw new Error('At least one test case is required.');
  }

  if (normalizedLanguage === 'javascript') {
    return buildJavaScriptWrapper({
      userCode: trimmedUserCode,
      functionName: trimmedFunctionName,
      testCases,
      paramTypes,
    });
  }

  if (normalizedLanguage === 'python') {
    return buildPythonWrapper({
      userCode: trimmedUserCode,
      functionName: trimmedFunctionName,
      testCases,
      paramTypes,
    });
  }

  if (normalizedLanguage === 'java') {
    return buildJavaWrapper({
      userCode: trimmedUserCode,
      functionName: trimmedFunctionName,
      testCases,
      paramTypes,
    });
  }

  if (normalizedLanguage === 'cpp') {
    return buildCppWrapper({
      userCode: trimmedUserCode,
      functionName: trimmedFunctionName,
      testCases,
      paramTypes,
    });
  }

  throw new Error(`Unsupported language: ${language}`);
}

export function parseOutput(stdout) {
  return String(stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.startsWith(RESULT_MARKER))
    .map((line) => normalizeOutputValue(line.slice(RESULT_MARKER.length)));
}

export function evaluateOutput(outputs, testCases = []) {
  if (!Array.isArray(testCases) || testCases.length === 0) {
    throw new Error('At least one test case is required.');
  }

  const results = testCases.map((testCase, index) => {
    const actualOutput = normalizeOutputValue(outputs[index]);
    const expectedOutput = normalizeOutputValue(testCase?.expectedOutput);
    const passed = normalizeOutput(actualOutput) === normalizeOutput(expectedOutput);

    return {
      id: testCase.id,
      label: testCase.label,
      input: testCase.input,
      expectedOutput,
      actualOutput,
      status: passed ? 'Pass' : 'Fail',
    };
  });

  const passed = results.filter((result) => result.status === 'Pass').length;
  const total = testCases.length;

  return {
    passed,
    total,
    status: getVerdict(passed, total),
    results,
    outputs: results.map((result) => result.actualOutput),
  };
}
