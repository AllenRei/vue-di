# vuejection
## A Dependency Injection implementation for Vue.js

## Install

### install package
``` bash
npm install --save vuejection
```

### Initialize

> main.js
``` js
import {
  InjectorPlugin,
  RootMixin
} from 'vuejection';

Vue.use(InjectorPlugin, {
/* options */
});

new Vue({
  /* ... */
  mixins: [RootMixin],
  /* ... */
}).$mount('#app')
```

## How to use 

Example creates TestService that uses username constant as a dependency. You can use other services as dependencies as well

> services/test.js
``` js
export function TestService($username) {
    return {
        value: `Hello ${username}`,
        greet(){
            console.log(this.value);
        }
    }
}
```

> main.js
``` js
// add this before Vue instance creation
import { TestService } from './services/test'
Vue.constant('username', 'John')
Vue.service('test', TestService, ['username'])
// register TestService with 'test' name and define dependency 'username'
```

> Home.vue
``` js
<template>
    <div>
        {{ $test.value }}
    </div>
</template>
<script>
export default {
  name: 'home',
  uses: ['test'],
  mounted(){
      this.$test.greet() // prints "Hello John"
      /*
        All values in service are reactive as well, so if you update a value inside a service, it will also trigger an update in render. For example if you call
      */
      this.$test.value = "James"
      /* the value in template will also be updated */    
  }
}
</script>
```

## Manual Injector
You can use injector directly in components
``` js
export default {
    data() {
        return {
            test: null
        }
    },
    created(){
        this.test = this.$injector('test')
    }
}
```

## Scopes
You can define in which scope service should be initalized. As default it refers to scope param in config

```js
export default {
    uses: [{ service: 'test', scope: 'CUSTOM_SCOPE' }]
    /* ... */
}
```
You can use it inside manual injector as well

## Plugin options

| Key        | Type           | Default  | Comment | 
| ------------- | ------------- | ----- | ----- | 
| prefix      | string |  "$" | Services will be registered in components with given prefix |
| debug      | bool      |   false | Show advanced logging to console |
| strategy   | ['preload', null] | null | Use preload strategy if you want all services to be initialized immidiately in default scope |
| scope | string      | "default" | Sets the default namespace where services will be initialized |

## Memory cleanup
You can remove initialized instances of service calling 

```js
/* ... */
// removes all instances
this.$clear()
// removes all instances in 'default' scope
this.$clear('default')
// removes only Test service instance in 'default' scope
this.$clear('default', 'test');
/* ... */
```