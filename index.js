import Vue from 'vue';

let PREFIX = '$';
let DEBUG = false;
let STRATEGY = 'default'

let services = [];
let constants = {};

// Build a service instance from its template
function build(service) {
    let scope = scope || service.scope;
    let {
        scopes
    } = this.$root.$data;
    // check if we have service instance in current scope
    if (!scopes[scope][service.service]) {
        // if not, create one
        let serv = services.find(s => s.name == service.service);
        // get dependencies instances for service
        let deps = serv.dependencies.map(dep => {
            if (DEBUG)
                console.info(
                    `Resolving dependency for ${service.service}: ${JSON.stringify(dep)}`
                );
            return this.$injector(dep, scope);
        });
        deps.unshift(null);
        if (DEBUG) console.info(`Created ${service.service} instance in ${scope}`);
        // create service instance
        Vue.set(scopes[scope], service.service, new(Function.bind.apply(serv.impl, deps))());
    }
    return scopes[scope][service.service];
}
// parse service argument to a one template with full info
function parseService(service, defaultScope) {
    return {
        scope: typeof service !== 'string' && service.scope ?
            service.scope : defaultScope,
        service: typeof service === 'object' ? service.service : service,
        name: typeof service === 'object' && service.name ? service.name : service
    };
}

// delete services from memory
// only {scope} - removes all services from scope
// no params - removes all scopes and services
function clear(scope, service) {
    if (scope) {
        const {
            scopes
        } = this.$root.$data
        if (service) {
            if (DEBUG) console.info(`Clearing ${service} from ${scope}`);
            delete scopes[scope][service];
        } else {
            if (DEBUG) console.info(`Clearing all services from ${scope} scope`)
            delete scopes[scope];
        }
    } else {
        if (DEBUG) console.info(`Clearing all scopes`)
        for (const k in scopes) {
            delete scopes[k];
        }
    }
}

// customScope - force injection to the selected scope
const injector = function (service, customScope) {
    const {
        scopes
    } = this.$root.$data

    //bind builder to current vue context;
    const builder = build.bind(this)

    // check if requested service is a constant
    if (constants[service]) return constants[service]

    const parsed = parseService(service, customScope || this.$options.scope || this.$scope)

    if (DEBUG)
        console.info(
            `injecting  {${parsed.service}}|${parsed.scope}  in ${this.$options.name}`
        );

    if (!scopes[parsed.scope]) Vue.set(scopes, parsed.scope, {})

    scopes[parsed.scope][parsed.service] = builder(parsed)
    if (DEBUG) console.info('SCOPES STATE', scopes)
    return scopes[parsed.scope][parsed.service]
}

export const RootMixin = {
    data() {
        return {
            scopes: {}
        };
    },
    created() {
        if (STRATEGY === 'preload') {
            // Preload all registered services in default scope
            if (DEBUG)
                console.info(`-- Preloading services to ${this.$scope} scope`)
            services.forEach(serv => this.$injector(serv.name))
            if (DEBUG)
                console.info(`-- Preload finished`)
        }
        if (DEBUG) window.injectorScopes = this.scope;
    },
};

const DefaultMixin = {
    created() {
        if (this.$options.uses) {
            // Load dependencies for current component
            this.$options.uses.forEach(dep => {
                const p = parseService(dep)
                this[PREFIX + (dep.service ? dep.service : dep)] = this.$injector(dep)
            });
        }
    }
};

export const InjectorPlugin = function (Vue, options = {}) {
    let scope = options.scope || 'default';

    if (options.prefix) PREFIX = options.prefix;
    if (options.debug) DEBUG = options.debug;
    if (options.strategy) STRATEGY = options.strategy;

    Vue.prototype.$injector = injector;
    Vue.prototype.$clear = clear;
    Vue.prototype.$scope = scope;

    // Add a service to service list
    Vue.service = function (name, impl, args = []) {
        let options = {};
        // prepare an object with service info
        if (Array.isArray(args)) {
            options.dependencies = args;
        } else {
            console.warn("Bad service args!")
            options.dependencies = [];
        }

        options.name = name
        options.impl = impl
        services.push(options);
        if (DEBUG) console.info(`Registered service ${name}`, services);
    };

    // Define a constant that can be used throught DI
    Vue.constant = function (name, impl) {
        constants[name] = impl;
    }

    // Add Injector mixin to all Vue instances
    Vue.mixin(DefaultMixin);
    if (DEBUG) console.info(`Initialized DI plugin`);
};
