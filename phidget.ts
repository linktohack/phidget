import { Sdk } from './sdk';

let sdk = new Sdk('SDK_PHIDGETS.exe', './SDK');

export class Phidget {
    static start = () => sdk.execute(undefined,
        'initializing_phidgets',
        ['initialization_failed', 'no_nfcreader_detected'],
        'initialization_ok');


    static startWithOnlyOnePhidget = () =>
        sdk.execute(undefined,
            ['initializing_phidgets', 'initialization_failed'],
            undefined,
            'no_nfcreader_detected');


    static activeKey = (key: number) =>
        sdk.execute(`activeKey:${key}`,
            undefined,
            'error_while_activation',
            'activation_ok',
            2000);


    static activeLed = (led: number) =>
        sdk.execute(`activeLed:${led}`,
            undefined,
            'error_while_activation',
            'activation_ok',
            2000);

    static checkKeys = () =>
        sdk.execute('checkKeys',
            'checking_all_keys',
            'error_while_activation',
            'check_done',
            10000);

    static checkLeds = () =>
        sdk.execute('checkLeds',
            ['checking_all_leds', 'error_while_activation'],
            undefined,
            'check_done',
            10000);

    static openFirstTrap = () =>
        sdk.execute('openFirstTrap',
            ['opening_first_trap', 'closing_first_trap'],
            'cant_open_first_trap',
            'first_trap_closed',
            15000);

    static openSecondTrap = () =>
        sdk.execute('openSecondTrap',
            ['opening_second_trap', 'closing_second_trap'],
            'cant_open_second_trap',
            'second_trap_closed',
            15000);

    static saveLogs = () =>
        sdk.execute('saveLogs',
            undefined,
            undefined,
            undefined,
            100);

    static close = () =>
        sdk.execute('close',
            undefined,
            undefined,
            undefined,
            100);
}