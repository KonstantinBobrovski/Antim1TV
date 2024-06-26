module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '..',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/*/tests/*.e2e-spec.ts'],
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
};
