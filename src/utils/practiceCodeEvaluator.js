import { isOutputCorrect, normalizeOutput } from './performanceEvaluator';
import { getPracticeProblemMeta } from '../data/practiceProblemMeta';

const RESULT_MARKER = '__CODEMITRA_RESULT__';

function escapeJavaString(value) {
  return JSON.stringify(String(value)).replace(/\u2028|\u2029/g, '');
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

function toPythonLiteral(value) {
  return stableSerialize(value);
}

function convertArgument(argument, type, language) {
  const parsed = parseLiteral(argument);

  if (type === 'treeLevelOrder') {
    throw new Error('Automated evaluation is not configured for tree-based problems yet.');
  }

  if (language === 'Python') {
    return toPythonLiteral(parsed);
  }

  if (language === 'Java') {
    return toJavaLiteral(parsed, type);
  }

  if (language === 'C++') {
    return toCppLiteral(parsed, type);
  }

  throw new Error(`Unsupported language for automated evaluation: ${language}`);
}

function buildInvocationArguments({ input, paramTypes, language }) {
  const rawArgs = splitInputArguments(input);

  if (rawArgs.length !== paramTypes.length) {
    throw new Error('Test case input does not match the expected function signature.');
  }

  return rawArgs.map((argument, index) => convertArgument(argument, paramTypes[index], language));
}

function buildPythonWrapper({ userCode, functionName, testCases, paramTypes }) {
  const calls = testCases
    .map((testCase) => {
      const args = buildInvocationArguments({
        input: testCase.input,
        paramTypes,
        language: 'Python',
      }).join(', ');

      return `print(${JSON.stringify(RESULT_MARKER)} + json.dumps(Solution().${functionName}(${args}), separators=(",", ":")))`;
    })
    .join('\n');

  return `import json\n\n${userCode}\n\n${calls}\n`;
}

function buildJavaWrapper({ userCode, functionName, testCases, paramTypes }) {
  const calls = testCases
    .map((testCase) => {
      const args = buildInvocationArguments({
        input: testCase.input,
        paramTypes,
        language: 'Java',
      }).join(', ');

      return `System.out.println(${JSON.stringify(RESULT_MARKER)} + toJson(solution.${functionName}(${args})));`;
    })
    .join('\n    ');

  return `import java.util.*;

${userCode}

class Main {
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
    Solution solution = new Solution();
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
        language: 'C++',
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
  cout << "${RESULT_MARKER}" << toJson(solution.${functionName}(${invocationArgs})) << "\\n";`;
    })
    .join('\n\n  ');

  return `${userCode}

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
  Solution solution;
  ${calls}
  return 0;
}
`;
}

export function buildWrappedSubmission({ problemId, language, userCode, testCases }) {
  const meta = getPracticeProblemMeta(problemId);

  if (!testCases?.length) {
    throw new Error('No test cases available for this problem.');
  }

  if (language === 'Python') {
    return buildPythonWrapper({
      userCode,
      functionName: meta.functionName,
      testCases,
      paramTypes: meta.paramTypes,
    });
  }

  if (language === 'Java') {
    return buildJavaWrapper({
      userCode,
      functionName: meta.functionName,
      testCases,
      paramTypes: meta.paramTypes,
    });
  }

  if (language === 'C++') {
    return buildCppWrapper({
      userCode,
      functionName: meta.functionName,
      testCases,
      paramTypes: meta.paramTypes,
    });
  }

  throw new Error(`Unsupported language for automated evaluation: ${language}`);
}

export function parseMarkedOutputs(stdout) {
  return String(stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith(RESULT_MARKER))
    .map((line) => line.slice(RESULT_MARKER.length));
}

export function getVerdictFromCounts(passed, total) {
  if (passed === total) {
    return 'Great';
  }

  if (passed === 0) {
    return 'Blunder';
  }

  return 'Mistake';
}

export function evaluateOutputsAgainstTestCases(testCases, outputs) {
  const results = testCases.map((testCase, index) => {
    const actualOutput = outputs[index] ?? '';
    const passed = isOutputCorrect(actualOutput, testCase.expectedOutput);

    return {
      id: testCase.id,
      label: testCase.label,
      status: passed ? 'Pass' : 'Fail',
      actualOutput,
      normalizedActualOutput: normalizeOutput(actualOutput),
      expectedOutput: testCase.expectedOutput,
    };
  });

  const passed = results.filter((item) => item.status === 'Pass').length;
  const total = testCases.length;

  return {
    status: getVerdictFromCounts(passed, total),
    passed,
    total,
    failed: total - passed,
    outputs,
    results,
  };
}
