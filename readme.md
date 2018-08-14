# vuejection
## A Dependency Injection implementation for Vue.js

#### Install

``` bash
# install package
npm i -D vuejection
```

## Initialize

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
Vue.service('test', TestService)
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