"""
Tag cycle-new.svg with semantic class/data-order attributes so the
existing Phase 4 CSS/JS (.cy-dullable / .cy-lit / data-order=N) drives
progressive scroll-reveal on the new design-tool export.

The mapping is based on the bbox-cluster identification done in the
browser preview: groups[i] for specific i values correspond to cycle
nodes, arcs, annotations, and the red breakout. Pink policy nodes and
their connecting arrows are deliberately NOT tagged so they stay at
full opacity throughout the animation.
"""

from xml.etree import ElementTree as ET

ET.register_namespace('', 'http://www.w3.org/2000/svg')
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')

SVG_NS = '{http://www.w3.org/2000/svg}'

# (group-index -> (semantic name, data-order or None for static)).
# Indices match the order-of-appearance of <g> elements in cycle-new.svg
# as walked depth-first by ElementTree.iter().
TAGGING = {
    # Cycle nodes — outer pill mask wrapper + inner translated text group
    8:  ('N1',       1),
    76: ('N1',       1),
    21: ('N2',       2),
    19: ('N2',       2),
    28: ('N3',       3),
    17: ('N3',       3),
    35: ('N4',       4),
    18: ('N4',       4),
    # Arcs
    42: ('arc-1-2',  1),
    43: ('arc-1-2',  1),
    44: ('arc-1-2',  1),
    45: ('arc-2-3',  2),
    46: ('arc-2-3',  2),
    47: ('arc-2-3',  2),
    48: ('arc-3-4',  3),
    49: ('arc-4-1',  4),
    50: ('arc-4-1',  4),
    51: ('arc-4-1',  4),
    52: ('arc-4-1',  4),
    53: ('arc-4-1',  4),
    54: ('arc-4-1',  4),
    # Annotations on each arc
    77: ('ann-1-2',  1),
    78: ('ann-1-2',  1),
    79: ('ann-2-3',  2),
    80: ('ann-2-3',  2),
    81: ('ann-3-4',  3),
    82: ('ann-3-4',  3),
    55: ('ann-4-1',  4),
    56: ('ann-4-1',  4),
    # Red breakout dashed-arrow path cluster (curve from cycle to label)
    57: ('breakout', 4),
    58: ('breakout', 4),
    59: ('breakout', 4),
    60: ('breakout', 4),
    61: ('breakout', 4),
    62: ('breakout', 4),
    # Pink policy nodes — reveal alongside N3 (order 3) per design
    85:  ('pink-PL', 3),
    91:  ('pink-PL', 3), 92: ('pink-PL', 3), 93: ('pink-PL', 3),
    94:  ('pink-PL', 3), 95: ('pink-PL', 3), 96: ('pink-PL', 3), 97: ('pink-PL', 3),
    86:  ('pink-PR', 3),
    98:  ('pink-PR', 3), 99: ('pink-PR', 3), 100: ('pink-PR', 3),
    101: ('pink-PR', 3), 102: ('pink-PR', 3), 103: ('pink-PR', 3), 104: ('pink-PR', 3),
    87:  ('pink-PC', 3),
    69:  ('pink-PC', 3), 70: ('pink-PC', 3), 71: ('pink-PC', 3),
    72:  ('pink-PC', 3), 73: ('pink-PC', 3), 74: ('pink-PC', 3), 75: ('pink-PC', 3),
    88:  ('pink-PB', 3),
    105: ('pink-PB', 3), 106: ('pink-PB', 3), 107: ('pink-PB', 3),
    108: ('pink-PB', 3), 109: ('pink-PB', 3), 110: ('pink-PB', 3), 111: ('pink-PB', 3),
    # Pink connecting arrows — also reveal at order 3
    63:  ('pink-arrow-PB-PC', 3), 64: ('pink-arrow-PB-PC', 3), 65: ('pink-arrow-PB-PC', 3),
    66:  ('pink-arrow-PC-N3', 3), 67: ('pink-arrow-PC-N3', 3), 68: ('pink-arrow-PC-N3', 3),
    112: ('pink-arrow-PR-N3', 3), 113: ('pink-arrow-PR-N3', 3), 114: ('pink-arrow-PR-N3', 3),
    115: ('pink-arrow-PL-N3', 3), 116: ('pink-arrow-PL-N3', 3), 117: ('pink-arrow-PL-N3', 3),
    # "Pediatric TB seen to have lower public health returns" — between N3 and PC
    89: ('ann-pediatric', 3),
    90: ('ann-pediatric', 3),
}

# Top-level <path> elements (direct children of <svg>, not inside any <g>)
# tagged by their index in document order. Index 154 = "NEW DIAGNOSIS
# ALGORITHMS" red label text path that has no <g> ancestor.
PATH_TAGGING = {
    154: ('breakout-label', 4),
}


def _tag_element(el, name, order):
    existing_class = el.get('class', '')
    classes = set(existing_class.split()) if existing_class else set()
    classes.add('cy-dullable')
    el.set('class', ' '.join(sorted(classes)))
    el.set('data-cy', name)
    if order is not None:
        el.set('data-order', str(order))


def tag(infile: str, outfile: str) -> None:
    tree = ET.parse(infile)
    root = tree.getroot()
    groups = list(root.iter(SVG_NS + 'g'))
    paths = list(root.iter(SVG_NS + 'path'))
    print(f'Found {len(groups)} <g> elements, {len(paths)} <path> elements')

    g_tagged = 0
    for idx, (name, order) in TAGGING.items():
        if idx >= len(groups):
            print(f'WARN: g-index {idx} out of range')
            continue
        _tag_element(groups[idx], name, order)
        g_tagged += 1

    p_tagged = 0
    for idx, (name, order) in PATH_TAGGING.items():
        if idx >= len(paths):
            print(f'WARN: path-index {idx} out of range')
            continue
        _tag_element(paths[idx], name, order)
        p_tagged += 1

    print(f'Tagged {g_tagged} groups, {p_tagged} paths')
    tree.write(outfile, xml_declaration=False, encoding='unicode')


if __name__ == '__main__':
    tag('cycle-new.svg', 'cycle-tagged.svg')
    print('Wrote cycle-tagged.svg')
