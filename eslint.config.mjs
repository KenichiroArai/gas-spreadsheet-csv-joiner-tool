import { ESLint } from 'eslint';
import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';

const eslint = new ESLint({
    overrideConfig: {
        parser: parser,
        plugins: {
            typescript: plugin,
        },
        extends: ['plugin:@typescript-eslint/recommended'],
        rules: {
            'no-undef': 'warn',
            'no-unused-vars': ['warn', { args: 'all', argsIgnorePattern: '^_' }],
        },
    },
});

export default eslint;
