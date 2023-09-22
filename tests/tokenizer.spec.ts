import { Tokenizer } from '@src/helpers/tokenizer';

describe(Tokenizer.name, () => {
  it('should differenciate from simple text and tag tokens', () => {
    expect(Tokenizer.isTextToken('simple text')).toBeTruthy();
    expect(
      Tokenizer.isTextToken({ tag: 'FOOBAR', attrs: {}, children: [] })
    ).toBeFalsy();
  });

  it('should parse empty strings', () => {
    expect(new Tokenizer().parse('')).toEqual([]);
  });

  it('should parse simple strings', () => {
    expect(new Tokenizer().parse('Non-formatted string')).toEqual([
      'Non-formatted string',
    ]);
  });

  it('should parse simple tags', () => {
    expect(
      new Tokenizer().parse(
        'String with <foobar>some tag</foobar> without <b>Nesting</b>'
      )
    ).toEqual([
      'String with ',
      { tag: 'FOOBAR', attrs: {}, children: ['some tag'] },
      ' without ',
      { tag: 'B', attrs: {}, children: ['Nesting'] },
    ]);
  });

  it('should parse tags with attributes', () => {
    expect(
      new Tokenizer().parse(
        'String with <foobar attr1="123" attr2="xyz">some tag</foobar>.'
      )
    ).toEqual([
      'String with ',
      {
        tag: 'FOOBAR',
        attrs: {
          attr1: '123',
          attr2: 'xyz',
        },
        children: ['some tag'],
      },
      '.',
    ]);
  });

  it('should accept attributes specified without quotes', () => {
    expect(
      new Tokenizer().parse(
        'String with <foobar attr1=123 attr2=foo bar>some tag</foobar>.'
      )
    ).toEqual([
      'String with ',
      {
        tag: 'FOOBAR',
        attrs: {
          attr1: '123',
          attr2: 'foo',
          bar: '',
        },
        children: ['some tag'],
      },
      '.',
    ]);
    // order of attributes shouldn't matter
    expect(
      new Tokenizer().parse(
        'String with <foobar attr1=123 bar attr2=foo>some tag</foobar>.'
      )
    ).toEqual([
      'String with ',
      {
        tag: 'FOOBAR',
        attrs: {
          attr1: '123',
          attr2: 'foo',
          bar: '',
        },
        children: ['some tag'],
      },
      '.',
    ]);
  });

  it('should accept attributes together with the closing tag', () => {
    expect(
      new Tokenizer().parse('before <tag attr="value">child</tag> after')
    ).toEqual([
      'before ',
      {
        tag: 'TAG',
        attrs: {
          attr: 'value',
        },
        children: ['child'],
      },
      ' after',
    ]);

    expect(
      new Tokenizer().parse('before <tag attr=value>child</tag> after')
    ).toEqual([
      'before ',
      {
        tag: 'TAG',
        attrs: {
          attr: 'value',
        },
        children: ['child'],
      },
      ' after',
    ]);

    expect(new Tokenizer().parse('before <tag flag>child</tag> after')).toEqual(
      [
        'before ',
        {
          tag: 'TAG',
          attrs: {
            flag: '',
          },
          children: ['child'],
        },
        ' after',
      ]
    );
  });

  it('should accept attributes together with the self-closing tag', () => {
    expect(new Tokenizer().parse('before <tag attr="value"/> after')).toEqual([
      'before ',
      {
        tag: 'TAG',
        attrs: {
          attr: 'value',
        },
        children: [],
      },
      ' after',
    ]);

    expect(new Tokenizer().parse('before <tag attr=value/> after')).toEqual([
      'before ',
      {
        tag: 'TAG',
        attrs: {
          attr: 'value',
        },
        children: [],
      },
      ' after',
    ]);

    expect(new Tokenizer().parse('before <tag flag/> after')).toEqual([
      'before ',
      {
        tag: 'TAG',
        attrs: {
          flag: '',
        },
        children: [],
      },
      ' after',
    ]);
  });

  it('should accept attributes specified without values (flags)', () => {
    expect(
      new Tokenizer().parse(
        'String with <foobar attr1 attr2>some tag</foobar>.'
      )
    ).toEqual([
      'String with ',
      {
        tag: 'FOOBAR',
        attrs: {
          attr1: '',
          attr2: '',
        },
        children: ['some tag'],
      },
      '.',
    ]);
  });

  it('should parse tag names as case-insensitive', () => {
    const texts = [
      '<tagName>content</tagName>',
      '<TAGNAME>content</TAGNAME>',
      '<tagname>content</TAGNAME>',
      '<TAGNAME>content</TagName>',
    ];
    texts.every((text) =>
      expect(new Tokenizer().parse(text)).toEqual([
        { tag: 'TAGNAME', attrs: {}, children: ['content'] },
      ])
    );
  });

  it('should parse self-closing tags', () => {
    expect(new Tokenizer().parse('a <br /> z')).toEqual([
      'a ',
      { tag: 'BR', attrs: {}, children: [] },
      ' z',
    ]);
    expect(new Tokenizer().parse('a <FOO data-attr="bar" /> z')).toEqual([
      'a ',
      { tag: 'FOO', attrs: { 'data-attr': 'bar' }, children: [] },
      ' z',
    ]);
  });

  it('should parse nested/complex strings', () => {
    expect(
      new Tokenizer().parse(
        '<a attr1="123">some <b attr2="xyz"><i>nested</i>tag</b></a>.'
      )
    ).toEqual([
      {
        tag: 'A',
        attrs: {
          attr1: '123',
        },
        children: [
          'some ',
          {
            tag: 'B',
            attrs: {
              attr2: 'xyz',
            },
            children: [
              {
                tag: 'I',
                attrs: {},
                children: ['nested'],
              },
              'tag',
            ],
          },
        ],
      },
      '.',
    ]);
  });

  it('should ignore attributes on the closing tags', () => {
    expect(
      new Tokenizer().parse(
        '<tagName attr="xyz">content</tagName foo="123" bar="456">'
      )
    ).toEqual([
      {
        tag: 'TAGNAME',
        attrs: {
          attr: 'xyz',
        },
        children: ['content'],
      },
    ]);
  });

  it('should handle spaces between opening tags and tag name as text', () => {
    expect(new Tokenizer().parse('< tagName>content</tagName>')).toEqual([
      '< tagName>content',
    ]);
  });

  it('should handle spaces between closing tags and tag name as comments (ignore)', () => {
    expect(new Tokenizer().parse('< tagName>content</ tagName>')).toEqual([
      '< tagName>content',
    ]);
  });

  it('should ignore tags closing unopened tags', () => {
    expect(new Tokenizer().parse('< tagName>content</tagName>')).toEqual([
      '< tagName>content',
    ]);
    expect(
      new Tokenizer().parse('<tagName>content <a>link</a></b></tagName>')
    ).toEqual([
      {
        tag: 'TAGNAME',
        attrs: {},
        children: [
          'content ',
          {
            tag: 'A',
            attrs: {},
            children: ['link'],
          },
        ],
      },
    ]);
  });

  it('should close automatically remaining tags', () => {
    expect(new Tokenizer().parse('<tagName>content <a>link')).toEqual([
      {
        tag: 'TAGNAME',
        attrs: {},
        children: [
          'content ',
          {
            tag: 'A',
            attrs: {},
            children: ['link'],
          },
        ],
      },
    ]);
    expect(new Tokenizer().parse('<tagName>content <a>link</tagName>')).toEqual(
      [
        {
          tag: 'TAGNAME',
          attrs: {},
          children: [
            'content ',
            {
              tag: 'A',
              attrs: {},
              children: ['link'],
            },
          ],
        },
      ]
    );
  });

  it('should ignore trailing spaces after tags', () => {
    expect(new Tokenizer().parse('<tagName >content</ tagName >')).toEqual([
      {
        tag: 'TAGNAME',
        attrs: {},
        children: ['content'],
      },
    ]);
  });

  it('should ignore spaces between attrs, values...', () => {
    expect(
      new Tokenizer().parse('<tagName attr = "val">content</tagName>')
    ).toEqual([
      {
        tag: 'TAGNAME',
        attrs: {
          attr: 'val',
        },
        children: ['content'],
      },
    ]);
  });

  it('should parse attributes with spaces in the value', () => {
    expect(
      new Tokenizer().parse('<tagName attr="basic">content</tagName>')
    ).toEqual([
      { tag: 'TAGNAME', attrs: { attr: 'basic' }, children: ['content'] },
    ]);
    expect(
      new Tokenizer().parse('<tagName attr="with space">content</tagName>')
    ).toEqual([
      { tag: 'TAGNAME', attrs: { attr: 'with space' }, children: ['content'] },
    ]);
    expect(
      new Tokenizer().parse(
        '<tagName attr=" with   multiple   spaces ">content</tagName>'
      )
    ).toEqual([
      {
        tag: 'TAGNAME',
        attrs: { attr: ' with   multiple   spaces ' },
        children: ['content'],
      },
    ]);
  });

  it('should parse attributes with single quotes as well as double quotes', () => {
    expect(
      new Tokenizer().parse(
        "<tagName attr='value' with-quote='has\"quote'>content</tagName>"
      )
    ).toEqual([
      {
        tag: 'TAGNAME',
        attrs: { attr: 'value', 'with-quote': 'has"quote' },
        children: ['content'],
      },
    ]);
  });

  it('should parse attributes with "complex" names', () => {
    expect(
      new Tokenizer().parse('<tagName attr-name="value">content</tagName>')
    ).toEqual([
      {
        tag: 'TAGNAME',
        attrs: { 'attr-name': 'value' },
        children: ['content'],
      },
    ]);
  });

  it('should accept quotes as part of names', () => {
    expect(
      new Tokenizer().parse('<tagName "attr"="value">content</tagName>')
    ).toEqual([
      { tag: 'TAGNAME', attrs: { '"attr"': 'value' }, children: ['content'] },
    ]);
    expect(
      new Tokenizer().parse('<tagName \'attr\'="value">content</tagName>')
    ).toEqual([
      { tag: 'TAGNAME', attrs: { "'attr'": 'value' }, children: ['content'] },
    ]);
  });

  it('should not escape quotes within attribute values', () => {
    expect(
      new Tokenizer().parse('<tagName attr="ab\\"cd">content</tagName>')
    ).toEqual([
      {
        tag: 'TAGNAME',
        attrs: { attr: 'ab\\', 'cd"': '' },
        children: ['content'],
      },
    ]);
  });

  it('should ignore tags with not closed attributes', () => {
    expect(
      new Tokenizer().parse('String with <foobar attr1="123></foobar>.')
    ).toEqual(['String with ']);
  });

  it('should parse tags with not closed opening tag, as text', () => {
    expect(
      new Tokenizer().parse(
        'String with <foobar attr1="123" attr2="xyz" some tag</foobar>.'
      )
    ).toEqual([
      'String with ',
      {
        tag: 'FOOBAR',
        attrs: {
          attr1: '123',
          attr2: 'xyz',
          some: '',
          'tag<': '',
          foobar: '',
        },
        children: ['.'],
      },
    ]);
  });
});
