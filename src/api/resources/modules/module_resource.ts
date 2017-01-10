import {Connection} from '../../connection';
import {Resource} from '../../resource';

/**
 * A base class for all module endpoint resources.
 *
 * Module is not a resource in REST sense, but a helper endpoint
 * that is used for a specific use case.
 */
export abstract class ModuleResource extends Resource {
    /**
     * Constructs a new module resource.
     *
     * @param _module Module name
     * @param connection Connection with the genesis platform server
     */
    constructor(private _moduleName: string, connection: Connection) {
        super(connection);
    }

    /**
     * Gets module's name.
     */
    public get name(): string {
        return this._moduleName;
    }

    /**
     * Returns modules' base path.
     */
    protected getModulesBasePath(): string {
        return `${this.getBasePath()}/_modules`;
    }

    /**
     * Returns module's path.
     */
    protected getModulePath(): string {
        return `${this.getModulesBasePath()}/${this.name}`;
    }

    /**
     * Returns the path used for requesting a module's method.
     *
     * @param method Module's method.
     * @returns Module's method path.
     */
    protected getModuleMethodPath(method: string): string {
        return `${this.getModulePath()}/${method}`;
    }
}
