import 'rxjs/add/operator/last';
import { Phidget } from './phidget';

Phidget.startWithOnlyOnePhidget()
    .last()
    .flatMap(() => Phidget.activeKey(1))
    .flatMap(() => Phidget.activeKey(2))
    .flatMap(() => Phidget.activeKey(3))
    .flatMap(() => Phidget.activeKey(4))
    .flatMap(() => Phidget.activeKey(5))
    .flatMap(() => Phidget.activeKey(6))
    .subscribe(it => {
        console.log('next', it);
    }, it => {
        console.log('error', it);
    }, () => {
        console.log('completed');
    });