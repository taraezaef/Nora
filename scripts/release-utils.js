#!/usr/bin/env bun
import { dirname, resolve } from 'node:path';
export const repoRoot = resolve(import.meta.dir, '..');
export const envFlag = (name, defaultValue) => {
    const value = process.env[name];
    if (value == null || value === '') {
        return defaultValue;
    }
    return value !== '0';
};
export const requireEnv = (name) => {
    const value = process.env[name];
    if (!value) {
        fail(`${name} is required.`);
    }
    return value;
};
export const packageInfo = async () => (await Bun.file(resolve(repoRoot, 'package.json')).json());
export const fileExists = async (path) => (await Bun.file(path).exists());
export const ensureFile = async (path, message) => {
    if (!(await fileExists(path))) {
        fail(message);
    }
};
export const copyFile = async (source, destination) => {
    await Bun.$ `mkdir -p ${dirname(destination)}`;
    await Bun.write(destination, Bun.file(source));
};
export const fail = (message) => {
    console.error(`Error: ${message}`);
    process.exit(1);
};
export const run = async (command, options = {}) => {
    const subprocess = Bun.spawn(command, {
        cwd: options.cwd ?? repoRoot,
        env: {
            ...process.env,
            ...options.env,
        },
        stdout: 'inherit',
        stderr: 'inherit',
        stdin: 'inherit',
    });
    const exitCode = await subprocess.exited;
    if (exitCode !== 0) {
        fail(`Command failed with exit code ${exitCode}: ${command.join(' ')}`);
    }
};
export const commandExists = async (command) => {
    const subprocess = Bun.spawn(['/bin/sh', '-lc', `command -v ${command}`], {
        stdout: 'ignore',
        stderr: 'ignore',
    });
    return (await subprocess.exited) === 0;
};
