import { Fragment, createElement, useMemo } from 'react';
import { Tokenizer } from './helpers/tokenizer';
import { format } from './helpers/format';

/**
 * Definition of a handler to render unformatted text.
 *
 * Note that it stills need to specify `key={index}` as it might be called
 * as part of another tag content together with other children.
 */
export type FormatTextHandler = (
  index: number,
  text?: string
) => JSX.Element | null;
/**
 * Definition of a handler to render styled text
 *
 * Note that `key={index}` is needed because they might be rendered
 * together with other children as part of another tag content
 */
export type FormatTagHandler = (
  index: number,
  tag: TagData
) => JSX.Element | null;

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
export function createTextFormat(
  config: CreateTextFormatConfig
): React.FC<Props> {
  const keepUnknownTags = Boolean(config.keepUnknownTags);
  const textHandler: FormatTextHandler =
    config.textHandler ??
    ((index, text) => createElement(Fragment, { key: index }, text));
  const uppercasedTagHandlers = transformTagHandlers(config.tagHandlers);

  const TextFormat: React.FC<Props> = (props) => {
    // parsing text *might* be considered a heavy operation so we cache it
    // `props.children` is used to make sure it depends on the value, not the
    // props object which can change by mistake depending on how the component
    // is used (a.k.a., not using React properly ^^;)
    const formattedText = useMemo(() => {
      const text = props.children || '';
      const tokens = new Tokenizer().parse(text);
      return format(
        textHandler,
        uppercasedTagHandlers,
        config.defaultTagHandler,
        keepUnknownTags,
        tokens,
        0
      );
    }, [props.children]);

    return formattedText;
  };

  return TextFormat;
}

/**
 * Dummy-proof function to ensure that all the tag names are
 * provided in uppercase
 */
function transformTagHandlers(
  tags: CreateTextFormatConfig['tagHandlers']
): Exclude<CreateTextFormatConfig['tagHandlers'], undefined> {
  if (!tags) return {};

  return Object.entries(tags).reduce((acc, [tag, handler]) => {
    acc[tag.toUpperCase()] = handler;
    return acc;
  }, {} as Exclude<CreateTextFormatConfig['tagHandlers'], undefined>);
}
