import { ChildProcess, SpawnOptions } from 'child_process';
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
import * as debug from 'debug';


export type Spawn = (command: string, args?: string[], options?: SpawnOptions) => ChildProcess

export class Sdk {
  private running = false;
  private stdout$ = new Subject<string>();

  constructor(public process: ChildProcess) {
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

    let nextAsArray: string[] = typeof next === 'undefined' ? [] : typeof next === 'string' ? [next] : next;
    const errorAsArray: string[] = typeof error === 'undefined' ? [] : typeof error === 'string' ? [error] : error;
    const completedAsArray: string[] = typeof completed === 'undefined' ? [] : typeof completed === 'string' ? [completed] : completed;

    nextAsArray = nextAsArray.length === 0 ? completedAsArray : nextAsArray;

    const timeout$ = Observable.timer(0, timeout).take(2);

    if (!this.process) {
      return Observable.throw('process_not_started');
    }

    if (command) {
      if (this.running) {
        return Observable.throw('other_command_running');
      } else {
        this.running = true;
      }

      d('sending command: %s', command);
      this.process.stdin.write(`${command}\n`);
    }

    return Observable.create((emitter: Subscriber<string>) => {
      let subscription = Observable.combineLatest(this.stdout$, timeout$)
      // .subscribe(([line, timeout]: [string, number]) => {
        .subscribe((args: any) => {
            const line = args[0] as string;
            const timeout = args[1] as number;

            d('timer, %d', timeout);
            if (timeout) {
              emitter.error('command_time_out');
              return;
            }

            if (errorAsArray.indexOf(line) > -1 || completedAsArray.indexOf(line) > -1) {
              this.running = false;
            }

            if (nextAsArray.indexOf(line) > -1) {
              d('next: %s', line);
              emitter.next(line);
            }
            if (errorAsArray.indexOf(line) > -1) {
              d('error: %s', line);
              return emitter.error(line);
            }
            if (completedAsArray.indexOf(line) > -1) {
              d('completed');
              return emitter.complete();
            }
          },
          emitter.error, emitter.complete);

      return () => {
        subscription.unsubscribe();
      };
    });
  }

  executeWithRegExp(command: string | undefined,
                    next: RegExp[] | RegExp | undefined,
                    error: RegExp[] | RegExp | undefined,
                    completed: RegExp[] | RegExp | undefined,
                    timeout?: number | undefined): Observable<string> {
    const d = debug(`sdk:executeWithRegExp:${command}`);

    let nextAsArray: RegExp[] = typeof next === 'undefined' ? [] : next instanceof RegExp ? [next] : next;
    const errorAsArray: RegExp[] = typeof error === 'undefined' ? [] : error instanceof RegExp ? [error] : error;
    const completedAsArray: RegExp[] = typeof completed === 'undefined' ? [] : completed instanceof RegExp ? [completed] : completed;

    nextAsArray = nextAsArray.length === 0 ? completedAsArray : nextAsArray;

    const timeout$ = Observable.timer(0, timeout).take(2);

    if (!this.process) {
      return Observable.throw('process_not_started');
    }

    if (command) {
      if (this.running) {
        return Observable.throw('other_command_running');
      } else {
        this.running = true;
      }

      d('sending command: %s', command);
      this.process.stdin.write(`${command}\n`);
    }

    return Observable.create((emitter: Subscriber<string>) => {
      let subscription = Observable.combineLatest(this.stdout$, timeout$)
      // .subscribe(([line, timeout]: [string, number]) => {
        .subscribe((args: any) => {
            const line = args[0] as string;
            const timeout = args[1] as number;

            d('timer, %d', timeout);
            if (timeout) {
              emitter.error('command_time_out');
              return;
            }

            if (errorAsArray.find(it => it.test(line)) || completedAsArray.find(error => error.test(line))) {
              this.running = false;
            }

            if (nextAsArray.find(it => it.test(line))) {
              d('next: %s', line);
              emitter.next(line);
            }
            if (errorAsArray.find(it => it.test(line))) {
              d('error: %s', line);
              return emitter.error(line);
            }
            if (completedAsArray.find(it => it.test(line))) {
              d('completed');
              return emitter.complete();
            }
          },
          emitter.error, emitter.complete);

      return () => {
        subscription.unsubscribe();
      };
    });
  }
}


