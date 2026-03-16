import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.hoisted(() => {
    vi.stubEnv('DEV', 'true');
});

import { debug, isDevMode } from '@/lib/debug';

describe('debug utility', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.spyOn(console, 'info').mockImplementation(() => { });
        vi.spyOn(console, 'group').mockImplementation(() => { });
        vi.spyOn(console, 'groupEnd').mockImplementation(() => { });
        vi.spyOn(console, 'table').mockImplementation(() => { });
        vi.spyOn(console, 'time').mockImplementation(() => { });
        vi.spyOn(console, 'timeEnd').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('isDevMode returns true when in development', () => {
        expect(isDevMode()).toBe(true);
    });

    it('logs to console in development', () => {
        debug.log('test log');
        expect(console.log).toHaveBeenCalledWith('[DEBUG]', 'test log');
    });

    it('warns to console in development', () => {
        debug.warn('test warn');
        expect(console.warn).toHaveBeenCalledWith('[WARN]', 'test warn');
    });

    it('errors to console always', () => {
        debug.error('test error');
        expect(console.error).toHaveBeenCalledWith('[ERROR]', 'test error');
    });

    it('infos to console in development', () => {
        debug.info('test info');
        expect(console.info).toHaveBeenCalledWith('[INFO]', 'test info');
    });

    it('groups logs in development', () => {
        const fn = vi.fn();
        debug.group('test group', fn);
        expect(console.group).toHaveBeenCalledWith('test group');
        expect(fn).toHaveBeenCalled();
        expect(console.groupEnd).toHaveBeenCalled();
    });

    it('tables data in development', () => {
        const data = { a: 1 };
        debug.table(data);
        expect(console.table).toHaveBeenCalledWith(data);
    });

    it('times execution in development', () => {
        debug.time('test time');
        expect(console.time).toHaveBeenCalledWith('test time');
        debug.timeEnd('test time');
        expect(console.timeEnd).toHaveBeenCalledWith('test time');
    });
});
