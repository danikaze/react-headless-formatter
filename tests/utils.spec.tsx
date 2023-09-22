import { getOnlyPlainTextChild } from '@src/helpers/utils';

describe(getOnlyPlainTextChild.name, () => {
  it('should return undefined when multiple plain text children', () => {
    const text = <>plain text</>;
    const multiple = (
      <div>
        <>child 1</>
        <>child 2</>
        <>child 3</>
      </div>
    );

    expect(getOnlyPlainTextChild([text, text])).toBeUndefined();
    expect(getOnlyPlainTextChild([multiple])).toBeUndefined();
  });

  it('should return undefined when single not plain text child', () => {
    const notText = (
      <div>
        <span>Foobar</span>
      </div>
    );

    expect(getOnlyPlainTextChild([notText])).toBeUndefined();
  });

  it('should return undefined when the element itself is plain text', () => {
    expect(getOnlyPlainTextChild([<>Not children but text</>])).toBeUndefined();
  });

  it('should return the text when the child is a single plain text on a Fragment', () => {
    const text = 'Plain text';
    expect(
      getOnlyPlainTextChild([
        <div>
          <>{text}</>
        </div>,
      ])
    ).toBe(text);
  });
});
