import { createElement, Fragment } from 'react';
import { FormatTextHandler, FormatTagHandler, TagData } from '..';
import { Tokenizer, TagToken, Token } from './tokenizer';

export function format<H extends any[]>(
  plainText: FormatTextHandler<H>,
  tags: Record<string, FormatTagHandler<H>>,
  defaultTag: FormatTagHandler<H> | undefined,
  keepUnknownTags: boolean,
  tokens: Token | Token[],
  index: number,
  hooks: H | undefined
): JSX.Element | null {
  if (!Array.isArray(tokens)) {
    return formatToken(
      plainText,
      tags,
      defaultTag,
      keepUnknownTags,
      tokens,
      index,
      hooks
    );
  }

  const elems = tokens.map((token, index) =>
    format(plainText, tags, defaultTag, keepUnknownTags, token, index, hooks)
  );
  return createElement(Fragment, { key: index }, elems);
}

function formatToken<H extends any[]>(
  plainText: FormatTextHandler<H>,
  tags: Record<string, FormatTagHandler<H>>,
  defaultTag: FormatTagHandler<H> | undefined,
  keepUnknownTags: boolean,
  token: Token,
  index: number,
  hooks: H | undefined
): JSX.Element | null {
  let elem: React.ReactNode;
  if (Tokenizer.isTextToken(token)) {
    elem = plainText(index, token, hooks!);
  } else {
    const handler = tags[token.tag];
    const elems = token.children.map((child, index) =>
      format(plainText, tags, defaultTag, keepUnknownTags, child, index, hooks)
    );

    const tagData: TagData = {
      name: token.tag,
      children: elems,
      attrs: token.attrs,
    };
    if (handler) {
      return handler(index, tagData, hooks!);
    } else if (defaultTag) {
      return defaultTag(index, tagData, hooks!);
    }

    return keepUnknownTags
      ? tagTokenToString(token.tag, token.attrs, elems, index)
      : createElement(Fragment, { key: index }, elems);
  }

  return createElement(Fragment, { key: index }, elem);
}

function tagTokenToString(
  tag: TagToken['tag'],
  attrs: TagToken['attrs'],
  children: (JSX.Element | null)[],
  index?: number
): JSX.Element {
  const attrsText = attrsToString(attrs);
  const content = `<${tag}${attrsText ? ` ${attrsText}` : ''}${
    children.length ? '>' : attrsText.length ? ' />' : '/>'
  }`;
  const openTag = createElement(
    'pre',
    { key: 0, style: { display: 'inline' } },
    content
  );
  const closeTag = children.length
    ? createElement(
        'pre',
        { key: 2, style: { display: 'inline' } },
        `</${tag}>`
      )
    : '';
  return createElement(Fragment, { key: index }, [openTag, children, closeTag]);
}

function attrsToString(attrs: TagToken['attrs']): string {
  return Object.entries(attrs)
    .reduce((res, [key, value]) => {
      res.push(`${key}="${value}"`);
      return res;
    }, [] as string[])
    .join(' ');
}
