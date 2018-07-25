import { Sdk } from './sdk';
import { ChildProcess } from 'child_process';


export class Phidget extends Sdk {

  constructor(public process: ChildProcess) {
    super(process);
  }

  start() {
    return this.execute(undefined,
      'initializing_phidgets',
      ['initialization_failed', 'no_nfcreader_detected'],
      'initialization_ok');
  }

  startWithFailed() {
    return this.execute(undefined,
      ['initializing_phidgets'],
      undefined,
      'initialization_failed');
  }

  activeKey(key: number) {
    return this.execute(`activeKey:${key}`,
      undefined,
      'error_while_activation',
      'activation_ok',
      2000);
  }

  activeLed(led: number) {
    return this.execute(`activeLed:${led}`,
      undefined,
      'error_while_activation',
      'activation_ok',
      2000);
  }

  checkKeys() {
    return this.execute('checkKeys',
      'checking_all_keys',
      'error_while_activation',
      'check_done',
      10000);
  }

  checkLeds() {
    return this.execute('checkLeds',
      ['checking_all_leds', 'error_while_activation'],
      undefined,
      'check_done',
      10000);
  }

  openFirstTrap() {
    return this.execute('openFirstTrap',
      ['opening_first_trap', 'closing_first_trap'],
      'cant_open_first_trap',
      'first_trap_closed',
      30000);
  }

  openSecondTrap() {
    return this.execute('openSecondTrap',
      ['opening_second_trap', 'closing_second_trap'],
      'cant_open_second_trap',
      'second_trap_closed',
      30000);
  }

  detectReaderUp(uid: string) {
    return this.execute(undefined,
      undefined,
      undefined,
      `readerUp:${uid}`,
      12000);
  }

  detectReaderDown(uid: string) {
    return this.execute(undefined,
      undefined,
      undefined,
      `readerDown:${uid}`,
      12000);
  }

  detectReaderKey() {
    return this.executeWithRegExp(undefined,
      /readerKeys:(.*)/,
      undefined,
      undefined);
  }

  saveLogs() {
    return this.execute('saveLogs',
      undefined,
      undefined,
      undefined,
      100);
  }

  close() {
    return this.execute('close',
      undefined,
      undefined,
      undefined,
      100);
  }

}
