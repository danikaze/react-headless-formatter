/// <reference types="react" />
/**
 * Definition of a handler to render unformatted text.
 *
 * Note that it stills need to specify `key={index}` as it might be called
 * as part of another tag content together with other children.
 */
export type FormatTextHandler = (index: number, text?: string) => JSX.Element | null;
/**
 * Definition of a handler to render styled text
 *
 * Note that `key={index}` is needed because they might be rendered
 * together with other children as part of another tag content
 */
export type FormatTagHandler = (index: number, tag: TagData) => JSX.Element | null;
export interface CreateTextFormatConfig {
    /**
     * This defines how the unformatted text will be rendered.
     * This applies to the top level without tags and every leaf node.
     *
     * Note that it stills need to specify `key={index}` as it might be called
     * as part of another tag content together with other children.
     *
     * Returns the text at it is by default
     */
    textHandler?: FormatTextHandler;
    /**
     * List of tags to handle (and how they are rendered).
     */
    tagHandlers?: Record<string, FormatTagHandler>;
    /**
     * Tag Handle to use if not found in `tagHandlers`
     */
    defaultTagHandler?: FormatTagHandler;
    /**
     * When `true`, if a tag is not supported it will be output as it is.
     * By default (`false`) it will be removed as it was not provided.
     */
    keepUnknownTags?: boolean;
}
export interface TagData {
    name: string;
    children: (JSX.Element | null)[];
    attrs: Record<string, string>;
}
export interface Props {
    children?: string;
}
/**
 * This _Component Factory_ accepts a configuration and returns a component that
 * can be used to render formatted strings from plain text converting it to
 * native React components.
 * Think about it as a controlled/styled HTML-like tags.
 */
export declare function createTextFormat(config: CreateTextFormatConfig): React.FC<Props>;
