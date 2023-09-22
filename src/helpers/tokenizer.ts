/**
 * The following text:
 * ```
 * <a href="url">some <b>bold</b> text</a>
 * ```
 * is represented by the following tokens:
 * ```
 * [{
 *   tag: 'A',
 *   attrs: { href: 'url' },
 *   children: [
 *     'some ',
 *     {
 *       tag: 'B',
 *       attrs: {},
 *       children: ['bold'],
 *     },
 *     ' text',
 *   ],
 * }]
 * ```
 */
export type Token = PlainTextToken | TagToken;

export type PlainTextToken = string;
export type TagToken = {
  tag: string;
  attrs: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any[]; // This should be Token[] but it creates a circular reference
};

/*
 *              VALUE_QUOTES
 *                 ▼     ▼
 *   <TagName attr="value">tag's content/children</TagName>
 *   ▲            ▲       ▲                      ▲        ▲
 * TAG_START ATTR_ASSIGN TAG_END      CLOSING_TAG_START  TAG_END
 *
 *    <SelfClosingTag />
 *    ▲               ▲
 *  TAG_START   SELF_CLOSING_TAG_END
 */
const TAG_START = '<';
const CLOSING_TAG_START = '</';
const TAG_END = '>';
const SELF_CLOSING_TAG_END = '/>';
const ATTR_ASSIGN = '=';
const VALUE_QUOTES = '\'"';
const SPACE = /[\s\t\n]/;
const SPACE_AND_CLOSING_TAGS = /[\s\t\n/>]/;
const TAG_NAME_ALLOWED_CHARS = /[a-z0-9._-]/i;
const ATTR_NAME_ALLOWED_CHARS = /[^\s\t\n=/>]/i;
const ATTR_NAME_ALLOWED_CHARS_AND_CLOSING_TAGS = /[^\s\t\n=]/i;

/**
 * While inspired by lexx/yacc for grammars (processing each machine-state in a
 * different function), it also works similar to RegExps in the way that it
 * keeps its state and keeps processing from the last point in each function,
 * so the next state (as in machine-state) can process its own part.
 */
export class Tokenizer {
  // text to parse
  private text!: string;
  // characters already processed
  private offset!: number;
  // stack of open tags (to track nesting)
  private tags!: string[];

  /**
   * Function that identifies if the token is for plain text or for a tag.
   * Used internally by `format` to choose the proper format handler.
   */
  public static isTextToken(token: Token): token is PlainTextToken {
    return typeof token === 'string';
  }

  /**
   * Get a basic string using tags and return the data structure that used to
   * render ReactNodes
   */
  public parse(text: string): Token[] {
    this.text = text;
    this.offset = 0;
    this.tags = [];

    return this.parseContent();
  }

  /**
   * Main parsing function, which detects and differenciates between plain text
   * (added as content) and tags (calling for parsing them), where this method
   * will be called again (recursively) for parsing the tags' contents.
   */
  private parseContent(): Token[] {
    const content: Token[] = [];
    const { text } = this;
    let startOffset = this.offset;

    while (this.offset < text.length) {
      /*
       * Closing tag
       * (needs to be processed BEFORE opening tag as "<" is a substring of "</")
       */
      if (this.nextStringIs(CLOSING_TAG_START)) {
        const contentEndOffset = this.offset;
        const validTag = this.isValidTag(CLOSING_TAG_START);

        if (contentEndOffset > startOffset) {
          content.push(text.substring(startOffset, contentEndOffset));
        }

        const tagName = this.parseTagName();
        this.skipTo(TAG_END);
        this.offset += TAG_END.length;
        startOffset = this.offset;

        if (!validTag) continue;

        const tagIndex = this.tags.lastIndexOf(tagName);
        if (tagIndex === -1) {
          continue;
        }
        while (this.tags.length > tagIndex) {
          this.tags.pop();
        }
        return content;
      }

      /*
       * Opening tag
       * (needs to be processed AFTER closing tag as "<" is a substring of "</")
       */
      if (this.nextStringIs(TAG_START)) {
        const contentEndOffset = this.offset;
        if (!this.isValidTag(TAG_START)) continue;

        if (contentEndOffset > startOffset) {
          content.push(text.substring(startOffset, contentEndOffset));
        }
        const tagContent = this.parseTag();
        tagContent && content.push(tagContent);
        startOffset = this.offset;
        continue;
      }

      /*
       * Regular character
       */
      this.offset++;
    }

    // if there was "leftovers" of text at the end when the string was finished,
    // it's added as basic string to the content
    if (startOffset < text.length) {
      content.push(text.substring(startOffset));
    }

    return content;
  }

  /**
   * A tag starts with `TAG_START` ("<") or `CLOSING_TAG_START` ("</") and then
   * a valid tag character.
   * This function checks if it's a valid tag or just the individual opening
   * character without being a tag
   */
  private isValidTag(tag: string): boolean {
    const nextChar = this.text[this.offset + tag.length];
    if (!TAG_NAME_ALLOWED_CHARS.test(nextChar)) {
      this.offset++;
      return false;
    }
    this.offset += tag.length;
    return true;
  }

  /**
   * Skips the specified `chars`.
   * If `inverse` is `true` then it will skip until one of the specified `chars`
   * is found
   */
  private skip(charsToSkip: string | RegExp, inverse?: boolean): void {
    const inv = Boolean(inverse);
    const method = typeof charsToSkip === 'string' ? 'includes' : 'test';

    while (
      this.offset < this.text.length &&
      (charsToSkip as string)[method as 'includes'](this.text[this.offset]) !==
        inv
    ) {
      this.offset++;
    }
  }

  /**
   * Skips characters until one of `charsToFind` is found
   * (like `String.indexOf` but accepting strings/RegExp + moving the offset
   * to the position where the first char is found)
   */
  private skipTo(charsToFind: string | RegExp): void {
    this.skip(charsToFind, true);
  }

  /**
   * Parses a tag, including its attributes and its content
   */
  private parseTag(): Token | undefined {
    try {
      const tag = this.parseTagName();
      this.tags.push(tag);
      const { attrs, selfClosed } = this.parseAttributes();
      const children = selfClosed ? [] : this.parseContent();

      return {
        tag,
        attrs,
        children,
      };
    } catch {
      // just return undefined
    }
  }

  /**
   * With the offset pointing to the start of the start of the tag name,
   * read the name and return it
   */
  private parseTagName(): string {
    const { text } = this;
    this.skipTo(TAG_NAME_ALLOWED_CHARS);
    const startOffset = this.offset;

    this.skip(TAG_NAME_ALLOWED_CHARS);
    return text.substring(startOffset, this.offset).toUpperCase();
  }

  private parseAttributes(): Pick<TagToken, 'attrs'> & { selfClosed: boolean } {
    const attrs: TagToken['attrs'] = {};
    let selfClosed: boolean;

    // read all the attributes until a closing tag is found
    for (;;) {
      // seek the starting position of the attribute (or closing tag)
      this.skipTo(ATTR_NAME_ALLOWED_CHARS_AND_CLOSING_TAGS);

      // check if we found a closing tag instead of an attribute
      if (this.nextStringIs(TAG_END)) {
        this.offset += TAG_END.length;
        selfClosed = false;
        break;
      }
      if (this.nextStringIs(SELF_CLOSING_TAG_END)) {
        this.offset += SELF_CLOSING_TAG_END.length;
        selfClosed = true;
        break;
      }

      const attrRes = this.parseAttribute();
      if (attrRes) {
        attrs[attrRes.name] = attrRes.value;
      }
    }

    return { attrs, selfClosed };
  }

  /**
   * Read the text and return the next found attribute (name/value) if found.
   * When not found, throws an exception (as there should be an attribute)
   *
   * "Flags" are a special type of attributes without value, and their value will
   * be always set to `true`.
   */
  private parseAttribute(): { name: string; value: string } | undefined {
    // read attribute name
    const nameStart = this.offset;
    this.skip(ATTR_NAME_ALLOWED_CHARS);
    // if it's not a valid character, skip it to avoid endless-loop
    if (this.offset === nameStart) {
      this.offset++;
      return;
    }
    const name = this.text.substring(nameStart, this.offset);
    this.skip(SPACE);
    // if there's no assignment, it means it's just a "flag" (empty string)
    if (!this.nextStringIs(ATTR_ASSIGN)) {
      return { name, value: '' };
    }
    // "consume" the assignment character that was just read
    this.offset += ATTR_ASSIGN.length;
    // seek for the value start point
    this.skip(SPACE);
    // read attribute value
    let value: string;
    const quote = this.text[this.offset];
    if (VALUE_QUOTES.includes(quote)) {
      this.offset++; // "consume" the opening quote
      const valueStart = this.offset;
      this.skipTo(quote);
      if (this.offset === this.text.length) {
        throw new Error('Malformed attribute');
      }
      value = this.text.substring(valueStart, this.offset);
      this.offset++; // "consume" the closing quote
    } else {
      const valueStart = this.offset;
      this.skipTo(SPACE_AND_CLOSING_TAGS);
      value = this.text.substring(valueStart, this.offset);
    }

    return { name, value };
  }

  /**
   * Checks if the next part of `text` (from `offset`) is `word`
   * It doesn't check more than the length of the requested word
   */
  private nextStringIs(word: string): boolean {
    return this.text.indexOf(word, this.offset) === this.offset;
  }
}
