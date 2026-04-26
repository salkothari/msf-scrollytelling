"""
Tag algo-a.svg and algo-b.svg with `class="dep-dullable"` and
`data-depth=N` so the existing scroll-progress reveal pipeline can
unhide each WHO TDA step in turn as the user scrolls through the
flow section.

Depth-band assignment is by Y-coordinate of each top-level shape
group (the design tool exports each pill/diamond/label as its own
<g width=... height=... transform="translate(x, y)"> wrapper). The
seven WHO steps map to the following Y bands; thresholds were
picked from inspecting box positions in both files:

    1  Entry — "Presence of danger signs?"
    2  Risk assessment + stabilize + treat non-TB outcome
    3  Lab tests — Test samples + persistent symptoms
    4  TB detected? — TEST UNAVAILABLE + Was TB detected?
    5  Contact history — Was there close/household TB?
    6  Scoring step — Score symptoms (+ CXR for A) / No TB
    7  Treatment — Start TB Treatment / Is sum >= 10?

The script also injects `class="dep-dullable"` for CSS targeting.
Re-runnable; tags are recomputed from scratch each call.
"""

import re
from xml.etree import ElementTree as ET

ET.register_namespace('', 'http://www.w3.org/2000/svg')
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')

SVG_NS = '{http://www.w3.org/2000/svg}'


def y_to_depth(y: float) -> int:
    """Map Y-coordinate (in SVG units) to a 1..7 depth band."""
    if y < 400:  return 1
    if y < 770:  return 2
    if y < 970:  return 3   # Test samples + Persistent symptoms (incl. TEST UNAVAILABLE label)
    if y < 1110: return 4   # Was TB detected?
    if y < 1265: return 5   # Contact history
    if y < 1920: return 6   # Scoring + CXR + No TB
    return 7                # Treatment


# Pull the y from a `transform="translate(x, y) ..."` attribute.
TRANSLATE_RE = re.compile(r'translate\(\s*([\-\d.]+)\s*,\s*([\-\d.]+)\s*\)')


def extract_y(el):
    t = el.get('transform') or ''
    m = TRANSLATE_RE.search(t)
    if not m:
        return None
    return float(m.group(2))


def tag(infile: str, outfile: str) -> None:
    tree = ET.parse(infile)
    root = tree.getroot()

    # Strip the light-gray "board background" rect — it doesn't blend
    # with the dark site theme.
    removed_bg = 0
    for rect in list(root.iter(SVG_NS + 'rect')):
        if rect.get('id') == 'svg-board-background-color':
            parent = next((p for p in root.iter() if rect in list(p)), None)
            if parent is not None:
                parent.remove(rect)
                removed_bg += 1

    # Top-level shape groups: direct children of <svg> with both `width`
    # and `height` attributes, AND a translate transform. These wrap each
    # logical shape (box, label, arrow head/tail).
    tagged = 0
    counts = {}
    for child in list(root):
        if child.tag != SVG_NS + 'g':
            continue
        if not child.get('width') or not child.get('height'):
            continue
        y = extract_y(child)
        if y is None:
            continue
        depth = y_to_depth(y)
        existing = (child.get('class') or '').split()
        if 'dep-dullable' not in existing:
            existing.append('dep-dullable')
        child.set('class', ' '.join(existing))
        child.set('data-depth', str(depth))
        tagged += 1
        counts[depth] = counts.get(depth, 0) + 1

    print(f'  removed {removed_bg} bg rect | tagged {tagged} shapes  by depth: {dict(sorted(counts.items()))}')
    tree.write(outfile, xml_declaration=False, encoding='unicode')


if __name__ == '__main__':
    print('algo-a.svg ->', end=' ')
    tag('algo-a.svg', 'algo-a-tagged.svg')
    print('algo-b.svg ->', end=' ')
    tag('algo-b.svg', 'algo-b-tagged.svg')
