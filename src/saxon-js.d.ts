declare module 'saxon-js' {

  type XdmValue = object;

  type XdmArray = Array<XdmValue>;

  type DOMNode = object;

  type HashTrie = object;

  type DocumentFragment = object;

  /**
   * Constructs an XDM atomic value.
   */
  export function atom(value: boolean | number | string, type?: string): XdmValue;

  /**
   * Gets the SaxonJS configuration properties. (New in SaxonJS 2.4.)
   */
  export type ConfigurationProperties = {
    /**
     * If true, every update to the master document (the current HTML page in the browser)
     * will cause the indexes that back the fn:key() function to be deleted.
     * They will automatically be rebuilt when they are needed again.
     */
    autoResetIndexes: boolean
  };
  export function getConfigurationProperties(): ConfigurationProperties;

  /**
   * Get the value of a specific SaxonJS configuration property. (New in SaxonJS 2.4.)
   */
  export function getConfigurationProperty(name: string);

  /**
   * Returns an object containing standard information about the processor.
   */
  export type ProcessorInfo = {
    version: string,
    vendor: string,
    vendorURL: string,
    productName: string,
    productVersion: string,
    isSchemaAware: boolean,
    supportsSerialization: boolean,
    supportsBackwardsCompatibility: boolean,
    supportsNamespaceAxis: boolean,
    supportsStreaming: boolean,
    supportsDynamicEvaluation: boolean,
    supportsHigherOrderFunctions: boolean,
    xPathVersion: string,
    xsdVersion: string
  };
  export function getProcessorInfo(): ProcessorInfo;

  /**
   * Asynchronously retrieves a resource such as an XML document or text file, typically for use in a subsequent transformation.
   */
  type ResourceOptions = {
    location?: string,
    file?: string,
    text?: string,
    type?: "text" | "json" | "xml",
    encoding?: string,
    baseURI?: string,
    headers?: Record<string, boolean | number | string>
  };
  export function getResource(options: ResourceOptions): object;

  /**
   * Reset the indexes associated with a document. (New in SaxonJS 2.4.)
   */
  export function resetIndexes(doc: object);

  /**
   * Returns a lexical string representation of a DOM document, supporting most options of the W3C Serialization 3.1 specification.
   */
  type SerializationOptions = {
    method: string,
    indent?: boolean,
    encoding?: string
  };
  export function serialize(value: XdmValue, options?: SerializationOptions);

  /**
   * Sets the SaxonJS configuration properties. (New in SaxonJS 2.4.)
   */
  export function setConfigurationProperties(props: ConfigurationProperties);

  /**
   * Sets the value of a specific SaxonJS configuration property. (New in SaxonJS 2.4.)
   */
  export function setConfigurationProperty(name: string, value: any);

  /**
   * Sets the logging level for warnings, processing messages, or full tracing.
   * @param level the logging level:
   * -1	Loading log only
   * 0	Transform initialization logs
   * 1 (Default)	Warning logs
   * 2	Processing logs
   * 10	Full tracing
   */
  export function setLogLevel(level: number);

  /**
   * The main method used to invoke an XSLT 3.0 transformation.
   */
  export type ParameterMap = Record<string, string | number | boolean>;
  export type TransformationOptions = {
    stylesheetLocation?: string,
    stylesheetFileName?: string,
    stylesheetText?: string,
    stylesheetInternal?: object,
    stylesheetBaseURI?: string,
    sourceType?: string,
    sourceLocation?: string,
    sourceFileName?: string,
    sourceNode?: DOMNode,
    sourceText?: string,
    sourceBaseURI?: string,
    stylesheetParams?: ParameterMap,
    initialTemplate?: string,
    templateParams?: ParameterMap,
    tunnelParams?: ParameterMap,
    initialFunction?: string,
    functionParams?: Array<object>,
    initialMode?: string,
    initialSelection?: XdmValue,
    documentPool?: Record<string, DOMNode>,
    textResourcePool?: Record<string, string>,
    destination?: "replaceBody" | "appendToBody" | "prependToBody" | "raw" | "document" | "application" | "file" | "stdout" | "serialized",
    resultForm?: "default" | "array" | "iterator" | "xdm",
    outputProperties?: object,
    deliverMessage?: (DocumentFragment, string) => void,
    deliverResultDocument?: () => void,
    masterDocument?: DOMNode,
    baseOutputURI?: string,
    collations?: object,
    collectionFinder?: (uri?: string) => void,
    logLevel?: number,
    nonInteractive?: boolean
  };
  export function transform(options: TransformationOptions, execution?: string): any;

  export namespace XPath {
    /**
     * Allows dynamic evaluation of an XPath 3.1 expression.
     */
    export function evaluate();
  }

  export namespace XS {

    export namespace QName {
      /**
       * Construct an xs:QName.
       * @param prefix
       * @param uri
       * @param local
       */
      export function fromParts(prefix, uri, local);
    }
  }
}
