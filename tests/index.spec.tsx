import { createElement, Fragment } from 'react';
import { render } from '@testing-library/react';
import { CreateTextFormatConfig, createTextFormat } from '@src';

interface TestOptions {
  Formatter: ReturnType<typeof createTextFormat>;
  text: string | undefined;
  expectedHtml: string;
}

describe(createTextFormat.name, () => {
  let testId = 0;
  let counter = 0;

  beforeEach(() => {
    counter = 0;
  });

  async function test({
    Formatter,
    text,
    expectedHtml,
  }: TestOptions): Promise<void> {
    const TEST_ID = `test-${++testId}`;
    const jsx = (
      <div data-testid={TEST_ID}>
        <Formatter>{text}</Formatter>
      </div>
    );
    const { findByTestId } = render(jsx);

    const elem = await findByTestId(TEST_ID);
    const html = elem.innerHTML;
    expect(html).toBe(expectedHtml);
  }

  function useCounter() {
    return ++counter;
  }

  const BasicTextFormat = (() => {
    const textHandler: CreateTextFormatConfig['textHandler'] = (
      index,
      text
    ) => <>{text}</>;
    const tagHandlers: CreateTextFormatConfig['tagHandlers'] = {};
    return createTextFormat({ textHandler, tagHandlers });
  })();

  const LeafTextFormat = (() => {
    // format leaf nodes as well
    const textHandler: CreateTextFormatConfig['textHandler'] = (
      index,
      text
    ) => <span key={index}>{text}</span>;
    const tagHandlers: CreateTextFormatConfig['tagHandlers'] = {
      b: (index, { children }) => <strong key={index}>{children}</strong>,
      i: (index, { children }) => <em key={index}>{children}</em>,
      a: (index, { children, attrs }) => (
        <a key={index} href={attrs.href}>
          {children}
        </a>
      ),
    };
    return createTextFormat({ textHandler, tagHandlers });
  })();

  const TextFormat = (() => {
    const tagHandlers: CreateTextFormatConfig['tagHandlers'] = {
      b: (index, { children }) => <strong key={index}>{children}</strong>,
      i: (index, { children }) => <em key={index}>{children}</em>,
      a: (index, { children, attrs }) => (
        <a key={index} href={attrs.href}>
          {children}
        </a>
      ),
      link: (index, { children, attrs }) => (
        <a key={index} href={attrs.href}>
          {children}
        </a>
      ),
      price: (index, { attrs }) => {
        if (!attrs.qty) return null;
        const num = attrs.qty.replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
        const currency = attrs.usd !== undefined ? 'USD' : 'JPY';
        return (
          <span key={index}>
            {num}
            {currency}
          </span>
        );
      },
    };
    return createTextFormat({ tagHandlers });
  })();

  const TextFormatWithTags = (() => {
    const tagHandlers: CreateTextFormatConfig['tagHandlers'] = {
      b: (index, { children }) => <strong key={index}>{children}</strong>,
      i: (index, { children }) => <em key={index}>{children}</em>,
      a: (index, { children, attrs }) => (
        <a key={index} href={attrs.href}>
          {children}
        </a>
      ),
      link: (index, { children, attrs }) => (
        <a key={index} href={attrs.href}>
          {children}
        </a>
      ),
    };
    return createTextFormat({ tagHandlers, keepUnknownTags: true });
  })();

  const TextFormatWithDefault = (() => {
    const tagHandlers: CreateTextFormatConfig['tagHandlers'] = {
      b: (index, { children }) => <strong key={index}>{children}</strong>,
    };
    const defaultTagHandler: CreateTextFormatConfig['defaultTagHandler'] = (
      index
    ) => <Fragment key={index}>DEFAULT</Fragment>;

    return createTextFormat({ tagHandlers, defaultTagHandler });
  })();

  const TextFormatAnything = (() => {
    /*
     * Cheap html tag converter to React format.
     * Probably should handle some other extra cases, but this is enough for
     * the texts.
     * Maybe a TODO would be to provide a standard one to easily reuse?
     */
    const htmlHandler: CreateTextFormatConfig['defaultTagHandler'] = (
      index,
      { name, children, attrs }
    ) => {
      if (attrs.style) {
        const styles = attrs.style.split(';');
        (attrs as any).style = styles.reduce((acc, str) => {
          const parts = str.trim().split(':');
          if (!parts[0]) return acc;

          const key = parts[0].replace(/-(.)/g, (match, char) =>
            char.toUpperCase()
          );
          acc[key] = parts[1].trim();
          return acc;
        }, {} as Record<string, string>);
      }
      attrs.key = index.toString();
      return createElement(name.toLowerCase(), attrs, children);
    };
    return createTextFormat({ defaultTagHandler: htmlHandler });
  })();

  const TextFormatWithHooks = (() => {
    return createTextFormat({
      tagHandlers: {
        count: (index, data, [counter]) => (
          <Fragment key={index}>{counter}</Fragment>
        ),
      },
      hooks: () => [useCounter()],
    });
  })();

  it('should not fail if used with no children', async () => {
    await test({
      Formatter: TextFormat,
      text: undefined,
      expectedHtml: '',
    });
  });

  it('should process text without tags', async () => {
    const text = 'Basic text with no tags.';
    await test({
      Formatter: BasicTextFormat,
      text,
      expectedHtml: text,
    });
  });

  it('should format text plain text', async () => {
    await test({
      Formatter: LeafTextFormat,
      text: 'basic text',
      expectedHtml: '<span>basic text</span>',
    });
  });

  it('should format basic tags', async () => {
    await test({
      Formatter: LeafTextFormat,
      text: 'pre <i>italic</i> and <b>bold</b> post',
      expectedHtml:
        '<span>pre </span><em><span>italic</span></em><span> and </span><strong><span>bold</span></strong><span> post</span>',
    });
    await test({
      Formatter: TextFormat,
      text: 'pre <i>italic</i> and <b>bold</b> post',
      expectedHtml: 'pre <em>italic</em> and <strong>bold</strong> post',
    });
  });

  it('should format tags with attributes', async () => {
    await test({
      Formatter: TextFormat,
      text: 'pre <a href="https://github.com/danikaze">Github :)</a> post',
      expectedHtml:
        'pre <a href="https://github.com/danikaze">Github :)</a> post',
    });
    await test({
      Formatter: TextFormat,
      text: 'pre <link href="https://github.com/danikaze">Github :)</link> post',
      expectedHtml:
        'pre <a href="https://github.com/danikaze">Github :)</a> post',
    });
  });

  it('should format mixed formats', async () => {
    await test({
      Formatter: TextFormat,
      text: 'Go to <i>→</i> <a href="https://github.com/danikaze">Github <b>[<i>:)</i>]</b></a>.',
      expectedHtml:
        'Go to <em>→</em> <a href="https://github.com/danikaze">Github <strong>[<em>:)</em>]</strong></a>.',
    });
  });

  it('should ignore unknown tags', async () => {
    await test({
      Formatter: TextFormat,
      text: 'This <tag>has</tag> both <b>known</b>and unknown <foo attr="123">tags</foo>.',
      expectedHtml: 'This has both <strong>known</strong>and unknown tags.',
    });
  });

  it('should show unknown tags when specified', async () => {
    await test({
      Formatter: TextFormatWithTags,
      text: 'This <tag>has</tag> both <b>known</b>and <self /> unknown <foo attr="123" />tags.',
      expectedHtml: [
        'This ',
        '<pre style="display: inline;">&lt;TAG&gt;</pre>', // <tag>
        'has',
        '<pre style="display: inline;">&lt;/TAG&gt;</pre>', // </tag>
        ' both <strong>known</strong>and ',
        '<pre style="display: inline;">&lt;SELF/&gt;</pre>', // <self />
        ' unknown ',
        '<pre style="display: inline;">&lt;FOO attr="123" /&gt;</pre>', // <foo attr="123" />
        'tags.',
      ].join(''),
    });
  });

  it('should format nested tags', async () => {
    await test({
      Formatter: TextFormat,
      text: '<a href="http://url"><b>Link to <i>Service</i></b></a>',
      expectedHtml:
        '<a href="http://url"><strong>Link to <em>Service</em></strong></a>',
    });
    await test({
      Formatter: TextFormat,
      text: '<link href="http://url" ignoredAttr="xxx" ignoredFlag><b>Link to <i>Service</i></b></link>',
      expectedHtml:
        '<a href="http://url"><strong>Link to <em>Service</em></strong></a>',
    });
  });

  it('should render self-closing tags with values from attributes', async () => {
    await test({
      Formatter: TextFormat,
      text: 'Price: <price qty="12345" />',
      expectedHtml: 'Price: <span>12,345JPY</span>',
    });
  });

  it('should read flag attributes', async () => {
    await test({
      Formatter: TextFormat,
      text: 'Price: <price qty="12345" usd />',
      expectedHtml: 'Price: <span>12,345USD</span>',
    });
  });

  it('should read attribute values without quotes', async () => {
    await test({
      Formatter: TextFormat,
      text: 'Price: <price qty=12345 usd />',
      expectedHtml: 'Price: <span>12,345USD</span>',
    });
  });

  it('should not render with default tag handler if the tag is defined', async () => {
    await test({
      Formatter: TextFormatWithDefault,
      text: '<b>bold</b> <foo>Unknown tag</foo>',
      expectedHtml: '<strong>bold</strong> DEFAULT',
    });
  });

  it('should render anything', async () => {
    const html =
      'Free <div>Html <span>supporting</span> any <span style="font-weight: bold;">tag</span></div> passed.';
    await test({
      Formatter: TextFormatAnything,
      text: html,
      expectedHtml: html,
    });
  });

  it('should work with extra hooks', async () => {
    for (let i = 1; i < 5; i++) {
      await test({
        Formatter: TextFormatWithHooks,
        text: 'Count: <count/>',
        expectedHtml: `Count: ${i}`,
      });
    }
  });
});
