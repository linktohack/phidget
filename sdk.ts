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

export class Sdk {
    process: ChildProcess | undefined;
    private running = false;
    private stdout$ = new Subject<string>();

    constructor(private command: string, private cwd?: string) {
        if (cwd) {
            process.chdir(cwd);
        }

        this.process = spawn(command);

        this.process.stdout.on('data', data => {
            const d = debug('sdk:init');
            d('data: %s', data.toString());
            data.toString()
                .split('\r').join('')
                .split('\n')
                .filter(it => it !== '')
                .forEach(it => this.stdout$.next(it));
        });

        this.process.on('close', () => {
            this.running = false;
            this.process = undefined;
        });
    }

    execute(command: string | undefined,
            next: string[] | string | undefined,
            error: string[] | string | undefined,
            completed: string[] | string | undefined,
            timeout?: number | undefined): Observable<string> {
        const d = debug(`sdk:execute:${command}`);

        let nextAsArray = typeof next === 'undefined' ? [] : typeof next === 'string' ? [next] : next;
        const errorAsArray = typeof error === 'undefined' ? [] : typeof error === 'string' ? [error] : error;
        const completedAsArray = typeof completed === 'undefined' ? [] : typeof completed === 'string' ? [completed] : completed;

        nextAsArray = nextAsArray.length === 0 ? completedAsArray : nextAsArray;

        const timeout$ = Observable.timer(0, timeout).take(2);

        if (!this.process) {
            return Observable.throw('process_not_started');
        }

        if (this.running) {
            return Observable.throw('other_command_running');
        }

        this.running = true;

        const result$ = Observable.create((emitter: Subscriber<string>) => {
            let subscription = Observable.combineLatest(this.stdout$, timeout$)
                .subscribe(([it, out]: [string, number]) => {
                        d('timer, %d', out);
                        if (out) {
                            emitter.error('command_time_out');
                            return;
                        }

                        if (errorAsArray.indexOf(it) > -1 || completedAsArray.indexOf(it) > -1) {
                            this.running = false;
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
            this.process.stdin.write(`${command}\n`);
        }

        if (completedAsArray.length === 0) {
            if (!command) {
                this.running = false;
                return Observable.throw('empty_command');
            }

            return Observable.empty();
        }

        return result$;
    }
}


