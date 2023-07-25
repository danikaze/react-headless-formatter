# react-headless-formatter

- [Motivation](#motivation)
- [Usage](#usage)
  - [Example](#example)
  - [Types](#types)
  - [Configuration and Options](#configuration-and-options)
  - [Example of Formatting Handlers](#example-of-formatting-handlers)
- [Use Cases](#use-cases)
  - [Support a subset of tags](#support-a-subset-of-tags)
  - [Provide extended custom tags](#provide-extended-custom-tags)
  - [i18n formatted localizations](#i18n-formatted-localizations)
  - [Support Full HTML](#support-full-html)

Transform HTML-like strings into fully rendered React components.

```
npm install react-headless-formatter
```

For the eagers developer wanting to use this library, just check the [Usage](#usage) section.

## Motivation

When building a React-based application usually every content is rendered inside React... but there are cases where external HTML or text-based content needs to be supported:

- Content coming from external teams (i.e. business managed)
- Translated strings supporting format
- etc.

For those cases you might be considering to use [dangerouslySetInnerHTML](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html), but it's not a very _pretty_ nor secure practice and probably you deserve better.

## Usage

### Example

This library doesn't provide a React component per-se, but a **component factory**. This means it is intented to be used statically (not inside any rendering function) to create a component, and then use it in your application.

1. Create your component using the factory function:

```tsx
// your-app/components/text-format.tsx
import { createTextFormat } from 'react-headless-formatter';

export const TextFormat = createTextFormat({
  tagHandlers: {
    // your configuration here
    // See `Configuration and Options` section
    // or `Example of Formatting Handlers`
  },
});
```

2. Use your `TextFormat` component from anywhere in your app:

```tsx
// your-app/components/fancy-modal.tsx
import { FC } from 'react';
import { TextFormat } from './text-format';

export const FancyModal: FC<{ title: string; text: string }> = ({
  title,
  text,
}) => {
  return (
    <div className="modal-root">
      <h3>{title}</h3>
      <div className="modal-body">
        <TextFormat>{text}</TextFormat>
      </div>
      <button>Close</button>
    </div>
  );
};
```

This basically just stress the fact that you should **not** call `createTextFormat` while rendering your component (or at least it should be memoized), as it creates a new function every time and can be done statically.

### Types

#### FormatTextHandler

Function called when there's plain text to be formatted. Expected to return the element to render (or `null` to remove it).

Note that even if it just render plain texts, it stills need to specify `key={index}` as it might be called as part of another tag content together with other children, so React doesn't gives a `Warning`.

```ts
type FormatTextHandler = (index: number, text?: string) => JSX.Element | null;
```

#### FormatTagHandler

Function called when there's a tag to be formatted. Expected to return the element to render (or `null` to remove it), with `key={index}` to avoid the `warning: each child in a list should have a unique "key" prop.` by React.

```ts
type FormatTagHandler = (index: number, tag: TagData) => JSX.Element | null;
```

#### TagData

Data provided to render tags by handlers defined by `tagHandlers` or `defaultTagHandler`.

```ts
interface TagData {
  name: string;
  children: (JSX.Element | null)[];
  attrs: Record<string, string>;
}
```

### Configuration and Options

When calling `createTextFormat` you need to specify how the formatting should be done:

| Option              | Type                               | Default     | Description                                                                                                                                                                                                                                                               |
| ------------------- | ---------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `textHandler`       | `FormatTextHandler`                | `undefined` | Defines how plain text should be formatted. This includes top-level text as well as plain text inside each tag. When not defined, text is just rendered as text by `(index, text) => <Fragment key={index}>{text}</Fragment>`                                             |
| `tagHandlers`       | `Record<string, FormatTagHandler>` | `undefined` | Mapping between the tags and the handlers to format them. Tag names are case-insensitive.                                                                                                                                                                                 |
| `defaultTagHandler` | `FormatTagHandler`                 | `undefined` | When provided it allows for custom handling of the tags **not** defined in `tagHandlers`.                                                                                                                                                                                 |
| `keepUnknownTags`   | `Boolean`                          | `false`     | When `true` it renders the received text for a tag not defined in `tagHandlers`. Only applies if `defaultTagHandler` is `undefined`. When this is `false` or `undefined` and `defaultTagHandler` is `undefined`, _unregistered_ tags are removed from the formatted text. |

### Example of Formatting Handlers

Every handler code shown in the examples is to be used in the `tagHandlers` option when calling `createTextFormat`, but not shown to keep examples code short.

```ts
const tagHandlers = {
  tag1: handler1,
  tag2: handler2,
  // ...
  tagN: handlerN,
};

const TextFormat = createTextFormat({ tagHandlers });
```

#### Support for bold text in different flavors

This defines a basic tag handler that allows using `<b>` in the provided text, and it renders the same `<b>` HTML element:

```tsx
const tagHandlers = {
  b: (index, { children }) => <b key={index}>{children}</b>,
};
```

This defines a basic tag handler that allows using `<strong>` in the provided text, and it renders the equivalent HTML element:

```tsx
const tagHandlers = {
  b: (index, { children }) => <b key={index}>{children}</b>,
  strong: (index, { children }) => <strong key={index}>{children}</strong>,
};
```

This would allow the same but standardize the usage to use `<strong>` in both cases, plus a custom `<bold>` tag that uses custom styles:

```tsx
const tagHandlers = {
  b: (index, { children }) => <strong key={index}>{children}</strong>,
  strong: (index, { children }) => <strong key={index}>{children}</strong>,
  bold: (index, { children }) => (
    <span className={styles.boldText}>{children}</span>
  ),
};
```

This allows using the `href` tag attributes in a custom `<link>` tag (would work the same as `<a>`, but ignoring any attribute that is not `href`):

```tsx
const tagHandlers = {
  link: (index, { children, attrs }) => (
    <a key={index} href={attrs.href}>
      {children}
    </a>
  ),
};
```

This allows self-closing tags to provide user interaction with a `callback` provided by a `React.Context` (i.e. it would be used in the text as `<customButton />` or `<customButton label="Text" />`)

```tsx
const tagHandlers = {
  customButton: (index, { attrs }) => {
    const context = useContext(YourContext);
    return (
      <button key={index} onClick={context.callback}>
        {attrs.label || 'Click me!'}
      </button>
    );
  },
};
```

## Use Cases

### Support a subset of tags

Let's consider that only a certain group of HTML basic tags (`<b>`, `<i>`, `<a>`) needs to be supported, and also control how they are rendered or even provide some custom one like `<s>` for _strike_ or `<u>` for _underline_.

Those supported tags can be explicitly defined with:

```tsx
const config: CreateTextFormatConfig = {
  /*
   * Note how every returned element requires to specify a key
   * This is because they might be have siblings so it's required to avoid
   * the warning triggered by React
   */
  tagHandlers: {
    b: (index, { children }) => <strong key={index}>{children}</strong>,
    i: (index, { children }) => <em key={index}>{children}</em>,
    // Note how other attributes apart from href are ignored
    a: (index, { children, attr: { href } }) => <a href={href}>{children}</a>,
    s: (index, { children }) => (
      <span style={{ fontDecoration: 'strike' }}>{children}</span>
    ),
    u: (index, { children }) => (
      <span style={{ fontDecoration: 'underline' }}>{children}</span>
    ),
  },
};
```

These are very basic definitions, but they allow controlling how they are rendered, their styles, etc.

While the raw formatted text only specifies the tags per se, this renderer can handle their class names, styles, and other properties if needed.

### Provide extended custom tags

Consider a case where you want to render some especific component with custom behavior just by using a simple tag. Like a pre-defined link, or a button to close a modal, etc.

You can do it easily by providing your own tag handler:

```ts
const config: CreateTextFormatConfig = {
  tagHandlers: {
    ProfilePage: (index, children) => (
      <a key={index} href="/path/to/profile">
        {children ?? '[Profile Page]'}
      </a>
    ),
  },
};

const FormattedText = createTextFormat(config);
```

Now you can have a formatted text where you can _inject_ your component with pre-defined behavior like this:

```tsx
// the text probably comes from API or somewhere else
const text =
  'If you feel like changing your settings, just visit your <ProfilePage /> and play with the values.';

return <FormattedText>{text}</FormattedText>;
```

### i18n formatted localizations

While most of the translations in a React application can be easily done with simple translation files like:

```json
// en.json
{ "upload": "Upload" }

// ja.json
{ "upload": "アップロード" }

// es.json
{ "upload": "Subir" }
```

and then just render the text in your component using any of the available i18n libraries...

```tsx
// my-component.tsx
export const MyComponent = () => {
  const { t } = useTranslation();
  return <button onClick={upload}>{t('upload')}</button>;
};
```

Some times it might need to provide translations mixed with formatting where following a basic approach might require splitting the text in multiple strings like displaying keywords within a text in different colors. And not even then it's a trivial solution, as they could appear anywhere in the text depending of the structure of each language.

This is a perfect use case for `react-headless-formatter`, as those special keywords can defined via tags, and still be provided with plain text in json files. Just provide a tag handler for the special keywords to be rendered with the desired style and then they can be placed anywhere inside the text and translated with any word without having to think on the details.

This example shows how to do exactly this with a custom `<keyword>` tag:

```json
// en.json
{
  "myTextWithKeywords": "This is some text with special <keyword>keywords</keyword> that could appear <keyword>anywhere</keyword> in the document, but thanks to <keyword>react-headless-formatter</keyword> formatting them is now a trivial problem."
}
// ja.json
{
  "myTextWithKeywords": "これは特別な<keyword>キーワード</keyword>の入ってるテキストです。この<keyword>キーワードー</keyword>が文書のどこでも現れることができますが、<keyword>react-headless-formatter</keyword>のお陰様で、問題がありません。"
}
```

```tsx
// my-component.tsx
const TextFormat = createTextFormat({
  tagHandlers: {
    keyword: (index, { children }) => <span className={styles.keyword}>{children}</span>;
  }
});


export const MyComponent = () => {
  const { t } = useTranslation();
  return <TextFormat>{t('myTextWithKeywords')}</TextFormat>;
}
```

### Support Full HTML

As described in the `createTextFormat` function API, an optional `defaultTagHandler` setting is available to catch every received tag that was not defined in `tagHandlers`.

By taking advantage of this option and leaving `tagHandlers` undefined, a behavior similar to the browser parsing can be provided to transform HTML code into React components with something similar to this example:

```tsx
const htmlHandler: CreateTextFormatConfig['defaultTagHandler'] = (
  index,
  { name, children, attrs }
) => {
  // React requires CSS properties to be an object with camelCased properties
  // instead of the string provided in HTML for the "style" tag attribute
  if (attrs.style) {
    // convert from a string like `"font-weight: bold; color: red"`
    // to an object like `{ fontWeight: 'bold', color: 'red' }`
    const styles = attrs.style.split(';');
    attrs.style = styles.reduce((acc, str) => {
      const parts = str.trim().split(':');
      if (!parts[0]) return acc;

      const key = parts[0].replace(/-(.)/g, (match, char) =>
        char.toUpperCase()
      );
      acc[key] = parts[1].trim();
      return acc;
    }, {});
  }
  // a key needs to be provided always
  attrs.key = index.toString();

  // React expects native HTML tags to be in lowercase while components
  // are specified in PascalCase (and the tag `name` is provide in UPPERCASE)
  const tagName = name.toLowerCase();

  return createElement(tagName, attrs, children);
};

// create our text parser component
const HtmlToReact = createTextFormat({ defaultTagHandler: htmlHandler });

// and now we can use it like...
const text =
  '<div>This converts <em>native</em> <b>HTML</b> into <b>React</b></div>';
<HtmlToReact>{text}</HtmlToReact>;
```

Note that this is just a simple example and even if it takes care of the styles transformations, probably are other cases that needs to be handled (maybe `HtmlToReact` can be provided in a future version as an exported component by this library, **PR**s are welcomed!)
