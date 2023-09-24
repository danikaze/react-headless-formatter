/// <reference types="react" />
/**
 * Definition of a handler to render unformatted text.
 *
 * Note that it stills need to specify `key={index}` as it might be called
 * as part of another tag content together with other children.
 */
export type FormatTextHandler<H extends any[] = never> = [H] extends [never] ? (index: number, text: string | undefined) => JSX.Element | null : (index: number, text: string | undefined, hooks: H) => JSX.Element | null;
/**
 * Definition of a handler to render styled text
 *
 * Note that `key={index}` is needed because they might be rendered
 * together with other children as part of another tag content
 */
export type FormatTagHandler<H extends any[] = never> = [H] extends [never] ? (index: number, tag: TagData) => JSX.Element | null : (index: number, tag: TagData, hooks: H) => JSX.Element | null;
export type CreateTextFormatConfig<HooksReturnType extends any[] = never> = {
    /**
     * This defines how the unformatted text will be rendered.
     * This applies to the top level without tags and every leaf node.
     *
     * Note that it stills need to specify `key={index}` as it might be called
     * as part of another tag content together with other children.
     *
     * Returns the text at it is by default
     */
    textHandler?: FormatTextHandler<HooksReturnType>;
    /**
     * List of tags to handle (and how they are rendered).
     */
    tagHandlers?: Record<string, FormatTagHandler<HooksReturnType>>;
    /**
     * Tag Handle to use if not found in `tagHandlers`
     */
    defaultTagHandler?: FormatTagHandler<HooksReturnType>;
    /**
     * When `true`, if a tag is not supported it will be output as it is.
     * By default (`false`) it will be removed as it was not provided.
     */
    keepUnknownTags?: boolean;
} & ([HooksReturnType] extends [never] ? object : {
    /**
     * Extra hooks to call on every render, with the resulting data being passed
     * as an extra parameter to text and tag handlers.
     */
    hooks: () => HooksReturnType;
});
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
export declare function createTextFormat<H extends any[] = never>(config: CreateTextFormatConfig<H>): React.FC<Props>;
