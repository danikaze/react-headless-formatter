const FragmentType = Symbol.for('react.fragment');

/**
 * Because every TagHandler will receive the `children` as a `JSX.Element[]`
 * and some might accept a simple plain text as only child, this function will
 * help to return that text in case that the children is only one and typed
 * as a string.
 * It will return `undefined` in case of no children, more than one, or not
 * being a plain string.
 */
export function getOnlyPlainTextChild(
  children: JSX.Element[]
): string | undefined {
  const isPlainTextChild =
    children.length === 1 &&
    !Array.isArray(children[0].props.children) &&
    children[0].props.children.type === FragmentType &&
    typeof children[0].props.children.props.children === 'string';

  if (!isPlainTextChild) return;
  return children[0].props.children.props.children;
}
