//declare module 'saxon-js' {
  export class XdmAtomicValue {
    type: string;
    toString(): string;
    equals(value): boolean;
    hashCode(): string;
    matchKey(): string;
    compareTo(value: XdmAtomicValue): number;
  }

  export type XdmValue = Array<XdmAtomicValue>;

  export class XdmArray {
    size(): number;
    get(N: number): XdmValue;
  }

  export class XdmMap {
    containsKey(key: XdmAtomicValue): boolean;
    get(key: XdmAtomicValue): XdmValue | null;
    inSituPut(key: XdmAtomicValue, value: XdmValue);
    put(key: XdmAtomicValue, value: XdmValue): XdmMap;
    remove(key: XdmAtomicValue): XdmMap;
    forAllPairs(fn: ({key: XdmAtomicValue, value: XdmValue}) => void);
    keys(): Array<XdmAtomicValue>;
  }
  export class XdmFunction {
    getName(): string;
    getArity(): number;
  }

  export type HashTrie = object;

  /**
   * Constructs an XDM atomic value.
   */
  export function atom(value: boolean | number | string, type?: string): XdmAtomicValue;

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
    sourceNode?: Node,
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
    documentPool?: Record<string, Node>,
    textResourcePool?: Record<string, string>,
    destination?: "replaceBody" | "appendToBody" | "prependToBody" | "raw" | "document" | "application" | "file" | "stdout" | "serialized",
    resultForm?: "default" | "array" | "iterator" | "xdm",
    outputProperties?: object,
    deliverMessage?: (DocumentFragment, string) => void,
    deliverResultDocument?: () => void,
    masterDocument?: Node,
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
    export type EvaluateOptions = {
      params?: object,
      staticBaseURI?: string,
      namespaceContext?: object,
      xpathDefaultNamespace?: string,
      defaultDecimalFormat?: object,
      namedDecimalFormats?: object,
      resultForm?: "default" | "array" | "iterator" | "xdm",
    };
    export function evaluate(xpath: string, contextItem?: object, options?: EvaluateOptions): any;
  }

  export namespace XS {
    export class atom {
      name: string;
      code: string;
      fromString(str: string): XdmAtomicValue;
      cast(value: XdmAtomicValue): XdmAtomicValue;
      matches(value: XdmAtomicValue): boolean;
    }
    export class double extends atom {
      fromNumber(num: number): XdmAtomicValue;
    }
    export class decimal extends atom {
      fromNumber(num: number): XdmAtomicValue;
      fromBig(big: bigint): XdmAtomicValue;
    }
    export class integer extends atom {
      fromNumber(num: number): XdmAtomicValue;
      fromBig(big: bigint): XdmAtomicValue;
    }
    export class float extends atom {
      fromNumber(num: number): XdmAtomicValue;
    }
    export class bool extends atom {
      fromNumber(num: number): XdmAtomicValue;
    }
    export class QName extends atom {
      fromParts(prefix: string, uri: string, local: string): XdmAtomicValue;
      fromEQName(eqname: string): XdmAtomicValue;
    }
    export class dateTime extends atom {
      fromDate(date: Date, tzOffset: number): XdmAtomicValue;
    }
    export class date extends atom {
      fromDate(date: Date, tzOffset: number): XdmAtomicValue;
    }
    export class time extends atom {
      fromDate(date: Date, tzOffset: number): XdmAtomicValue;
    }
    export class dateTimeStamp extends atom {
      fromDate(date: Date, tzOffset: number): XdmAtomicValue;
    }
    export class duration extends atom {
      fromMonthsMilliseconds(months: number, millisecs: number): XdmAtomicValue;
    }
  }

  // namespace Atomic {
  //   export declare class XdmString extends XdmAtomicValue {}
  //   export declare class XdmBoolean extends XdmAtomicValue {}
  //   export declare class XdmDouble extends XdmAtomicValue {}
  //   export declare class XdmDecimal extends XdmAtomicValue {}
  //   export declare class XdmFloat extends XdmAtomicValue {}
  //   export declare class XdmInteger extends XdmAtomicValue {}
  //   export declare class XdmDateTime extends XdmAtomicValue {}
  //   export declare class XdmDate extends XdmAtomicValue {}
  //   export declare class XdmTime extends XdmAtomicValue {}
  //   export declare class XdmDateTimeStamp extends XdmAtomicValue {}
  //   export declare class XdmDuration extends XdmAtomicValue {}
  //   export declare class XdmQName extends XdmAtomicValue {}
  // }

  export class XError {
    code: string;
    message: string;
    name: "XError";
    xsltLineNr: number;
    xsltModule: string;
    errorObject: object;
    jsStack: string;
    getStackTrace(): string;
    getMessage(): string;
  }

//}
