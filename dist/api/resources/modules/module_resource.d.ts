import { Connection } from '../../connection';
import { Resource } from '../../resource';
/**
 * A base class for all module endpoint resources.
 *
 * Module is not a resource in REST sense, but a helper endpoint
 * that is used for a specific use case.
 */
export declare abstract class ModuleResource extends Resource {
    private _moduleName;
    /**
     * Constructs a new module resource.
     *
     * @param _module Module name
     * @param connection Connection with the genesis platform server
     */
    constructor(_moduleName: string, connection: Connection);
    /**
     * Gets module's name.
     */
    readonly name: string;
    /**
     * Returns modules' base path.
     */
    protected getModulesBasePath(): string;
    /**
     * Returns module's path.
     */
    protected getModulePath(): string;
    /**
     * Returns the path used for requesting a module's method.
     *
     * @param method Module's method.
     * @returns Module's method path.
     */
    protected getModuleMethodPath(method: string): string;
}
