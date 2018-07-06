import { Command } from './phidget';
import 'rxjs/add/operator/toArray';

Command.startWithOnlyOnePhidget()
    .toArray()
    .flatMap(() => Command.activeLed(1))
    .flatMap(() => Command.activeLed(2))
    .flatMap(() => Command.activeLed(3))
    .flatMap(() => Command.activeLed(4))
    .flatMap(() => Command.activeLed(5))
    .flatMap(() => Command.activeLed(6))
    .subscribe(it => {
        console.log('next', it);
    }, it => {
        console.log('error', it);
    }, () => {
        console.log('completed');
    });