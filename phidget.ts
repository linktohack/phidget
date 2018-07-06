import { ChildProcess, spawn } from 'child_process';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';

import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/combineLatest';

import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/empty';
import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/take';

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
    const d = debug(`phidget:execute:${command}`);

    let nextAsArray = typeof next === 'undefined' ? [] : typeof next === 'string' ? [next] : next;
    const errorAsArray = typeof error === 'undefined' ? [] : typeof error === 'string' ? [error] : error;
    const completedAsArray = typeof completed === 'undefined' ? [] : typeof completed === 'string' ? [completed] : completed;

    nextAsArray = nextAsArray.length === 0 ? completedAsArray : nextAsArray;

    const timeout$ = Observable.timer(0, timeout).take(2);

    if (!phidget) {
        return Observable.throw('phidget_not_started');
    }

    if (phidgetRunning) {
        return Observable.throw('other_command_running');
    }

    phidgetRunning = true;

    const result$ = Observable.create((emitter: Subscriber<string>) => {
        let subscription = Observable.combineLatest(phidgetResult, timeout$)
            .subscribe(([it, out]: [string, number]) => {
                    d('timer, %d', out);
                    if (out) {
                        emitter.error('command_time_out');
                        return;
                    }

                    if (errorAsArray.indexOf(it) > -1 || completedAsArray.indexOf(it) > -1) {
                        phidgetRunning = false;
                    }

                    if (nextAsArray.indexOf(it) > -1) {
                        d('next: %s', it);
                        emitter.next(it);
                    }
                    if (errorAsArray.indexOf(it) > -1) {
                        d('error: %s', it);
                        return emitter.error(it);
                    }
                    if (completedAsArray.indexOf(it) > -1) {
                        d('completed');
                        return emitter.complete();
                    }
                },
                emitter.error, emitter.complete);

        return () => {
            subscription.unsubscribe();
        };
    });


    if (command) {
        d('sending command: %s', command);
        phidget.stdin.write(`${command}\n`);
    }

    if (completedAsArray.length === 0) {
        if (!command) {
            phidgetRunning = false;
            return Observable.throw('empty_command');
        }

        return Observable.empty();
    }

    return result$;
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

    static startWithOnlyOnePhidget = () => {
        if (!phidget) {
            init();
        }

        return execute(undefined,
            ['initializing_phidgets', 'initialization_failed'],
            undefined,
            'no_nfcreader_detected');
    };

    static activeKey = (key: number) =>
        execute(`activeKey:${key}`,
            undefined,
            'error_while_activation',
            'activation_ok',
            2000);


    static activeLed = (led: number) =>
        execute(`activeLed:${led}`,
            undefined,
            'error_while_activation',
            'activation_ok',
            2000);

    static checkKeys = () =>
        execute('checkKeys',
            'checking_all_keys',
            'error_while_activation',
            'check_done',
            10000);

    static checkLeds = () =>
        execute('checkLeds',
            ['checking_all_leds', 'error_while_activation'],
            undefined,
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
