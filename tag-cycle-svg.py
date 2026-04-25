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
    # Red breakout label + arrow ("NEW DIAGNOSIS ALGORITHMS")
    57: ('breakout', 4),
    58: ('breakout', 4),
    59: ('breakout', 4),
    60: ('breakout', 4),
    61: ('breakout', 4),
    62: ('breakout', 4),
}


def tag(infile: str, outfile: str) -> None:
    tree = ET.parse(infile)
    root = tree.getroot()
    groups = list(root.iter(SVG_NS + 'g'))
    print(f'Found {len(groups)} <g> elements')

    tagged = 0
    for idx, (name, order) in TAGGING.items():
        if idx >= len(groups):
            print(f'WARN: index {idx} out of range')
            continue
        g = groups[idx]
        existing_class = g.get('class', '')
        classes = set(existing_class.split()) if existing_class else set()
        classes.add('cy-dullable')
        g.set('class', ' '.join(sorted(classes)))
        g.set('data-cy', name)
        if order is not None:
            g.set('data-order', str(order))
        tagged += 1

    print(f'Tagged {tagged} groups')
    tree.write(outfile, xml_declaration=False, encoding='unicode')


if __name__ == '__main__':
    tag('cycle-new.svg', 'cycle-tagged.svg')
    print('Wrote cycle-tagged.svg')
