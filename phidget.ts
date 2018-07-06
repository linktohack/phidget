import { ChildProcess, spawn } from 'child_process';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';

import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/empty';
import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/observable/timer';

import debug from 'debug';

let phidget: ChildProcess | undefined;
let phidgetRunning = false;
let phidgetResult = new Subject<string>();

function noop() {
}

function init() {
    phidget = spawn('SDK_PHIDGETS.exe');
    phidget.stdout.on('data', data => {
        const d = debug('phidget:init');
        d('data: %s', data.toString());
        data.toString()
            .split('\r').join('')
            .split('\n')
            .filter(it => it !== '')
            .forEach(it => phidgetResult.next(it));
    });

    phidget.on('close', () => {
        phidgetRunning = false;
        phidget = undefined;
    });
}

export function execute(command: string | undefined,
                        next: string[] | string | undefined,
                        error: string[] | string | undefined,
                        completed: string[] | string | undefined,
                        timeout?: number | undefined): Observable<string> {
    const d = debug('phidget:execute');

    const nextAsArray = typeof next === 'undefined' ? [] : typeof next === 'string' ? [next] : next;
    const errorAsArray = typeof error === 'undefined' ? [] : typeof error === 'string' ? [error] : error;
    const completedAsArray = typeof completed === 'undefined' ? [] : typeof completed === 'string' ? [completed] : completed;
    const timeout$ = Observable.timer(0, timeout);

    if (!phidget) {
        return Observable.throw('phidget_not_started');
    }

    if (phidgetRunning) {
        return Observable.throw('other_command_running');
    }

    phidgetRunning = true;

    const result$ = phidgetResult
        .withLatestFrom(timeout$)
        .flatMap(([it, out]: [string, number]) => {
            if (out) {
                throw 'command_time_out';
            }

            if (nextAsArray.indexOf(it) > -1) {
                return Observable.of(it);
            }

            if (errorAsArray.indexOf(it) > -1) {
                return Observable.throw(it);
            }

            if (completedAsArray.indexOf(it) > -1) {
                return Observable.empty();
            }

            return Observable.empty();
        });


    if (completedAsArray.length === 0) {
        if (!command) {
            phidgetRunning = false;
            return Observable.throw('empty_command');
        }
    }

    if (command) {
        d('sending command, %s', command);
        phidget.stdin.write(`${command}\n`);
    }

    if (completedAsArray.length === 0) {
        return Observable.empty();
    }

    return result$
        .map(it => {
            if (typeof it !== 'string') {
                throw 'what_type';
            }
            return it as string;
        })
        .do(noop, () => {
            phidgetRunning = false;
        }, () => {
            phidgetRunning = false;
        });
}

export class Command {
    static start = () => {
        if (!phidget) {
            init();
        }

        return execute(undefined,
            'initializing_phidgets',
            ['initialization_failed', 'no_nfcreader_detected'],
            'initialization_ok');
    };

    static activeKey = (key: string) =>
        execute(`activeKey:${key}`,
            undefined,
            'error_while_activation',
            'activation_ok',
            1000);


    static activeLed = (led: string) =>
        execute(`activeLed:${led}`,
            undefined,
            'error_while_activation',
            'activation_ok',
            1000);

    static checkKeys = () =>
        execute('checkKeys',
            'checking_all_keys',
            'error_while_activation',
            'check_done',
            10000);

    static checkLeds = () =>
        execute('checkLeds',
            'checking_all_leds',
            'error_while_activation',
            'check_done',
            10000);

    static openFirstTrap = () =>
        execute('openFirstTrap',
            ['opening_first_trap', 'closing_first_trap'],
            'cant_open_first_trap',
            'first_trap_closed',
            15000);

    static openSecondTrap = () =>
        execute('openSecondTrap',
            ['opening_second_trap', 'closing_second_trap'],
            'cant_open_second_trap',
            'second_trap_closed',
            15000);

    static saveLogs = () =>
        execute('saveLogs',
            undefined,
            undefined,
            undefined,
            100);

    static close = () =>
        execute('close',
            undefined,
            undefined,
            undefined,
            100);
}
