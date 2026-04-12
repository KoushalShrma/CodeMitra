package com.codemitra.backend.service;

import java.security.SecureRandom;
import org.springframework.stereotype.Component;

/**
 * Generates strong temporary passwords for institution credential provisioning.
 */
@Component
public class PasswordGeneratorUtil {

    private static final String UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijkmnopqrstuvwxyz";
    private static final String DIGITS = "23456789";
    private static final String SYMBOLS = "@#$%!";
    private static final String ALL = UPPER + LOWER + DIGITS + SYMBOLS;
    private static final int DEFAULT_LENGTH = 12;

    private final SecureRandom random = new SecureRandom();

    /**
     * Generates one random password containing upper/lower/digit/symbol characters.
     */
    public String generateTemporaryPassword() {
        char[] result = new char[DEFAULT_LENGTH];
        result[0] = randomChar(UPPER);
        result[1] = randomChar(LOWER);
        result[2] = randomChar(DIGITS);
        result[3] = randomChar(SYMBOLS);

        for (int i = 4; i < result.length; i += 1) {
            result[i] = randomChar(ALL);
        }

        shuffle(result);
        return new String(result);
    }

    private char randomChar(String source) {
        return source.charAt(random.nextInt(source.length()));
    }

    private void shuffle(char[] chars) {
        for (int i = chars.length - 1; i > 0; i -= 1) {
            int swapIndex = random.nextInt(i + 1);
            char tmp = chars[i];
            chars[i] = chars[swapIndex];
            chars[swapIndex] = tmp;
        }
    }
}