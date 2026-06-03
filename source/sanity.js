/* ─────────────────────────────────────────────────────────────
   CLVCH Sanity Client
   Public CDN reads — no token needed (production dataset is public).
   Project: yi9utzrz  Dataset: production
   ─────────────────────────────────────────────────────────────*/
(function () {
  var PROJECT  = 'yi9utzrz';
  var DATASET  = 'production';
  var API_BASE = 'https://' + PROJECT + '.apicdn.sanity.io/v2024-01-01/data/query/' + DATASET;

  // Convert a Sanity image asset _ref to a CDN URL.
  // Ref format: "image-{id}-{WxH}-{ext}"
  function imageUrl(ref) {
    if (!ref) return null;
    var m = ref.match(/^image-(.+)-(\d+x\d+)-(\w+)$/);
    if (!m) return null;
    return 'https://cdn.sanity.io/images/' + PROJECT + '/' + DATASET + '/' + m[1] + '-' + m[2] + '.' + m[3];
  }

  // Lightweight Portable Text → HTML renderer.
  // Handles: normal/h2/h3/blockquote blocks, bullet lists, strong/em marks.
  function portableTextToHtml(blocks) {
    if (!Array.isArray(blocks) || !blocks.length) return '';

    function spans(children) {
      return (children || []).map(function (s) {
        var t = (s.text || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        var m = s.marks || [];
        if (m.indexOf('strong') !== -1) t = '<strong>' + t + '</strong>';
        if (m.indexOf('em')     !== -1) t = '<em>'     + t + '</em>';
        return t;
      }).join('');
    }

    var out = [];
    var i = 0;
    while (i < blocks.length) {
      var b = blocks[i];
      if (!b || b._type !== 'block') { i++; continue; }

      // Collect consecutive bullet-list items into one <ul>
      if (b.listItem === 'bullet') {
        var items = [];
        while (i < blocks.length && blocks[i] && blocks[i].listItem === 'bullet') {
          items.push('<li>' + spans(blocks[i].children) + '</li>');
          i++;
        }
        out.push('<ul>' + items.join('') + '</ul>');
        continue;
      }

      var inner = spans(b.children);
      if      (b.style === 'h2')         out.push('<h2>' + inner + '</h2>');
      else if (b.style === 'h3')         out.push('<h3>' + inner + '</h3>');
      else if (b.style === 'blockquote') out.push('<blockquote><p>' + inner + '</p></blockquote>');
      else                               out.push('<p>' + inner + '</p>');
      i++;
    }
    return out.join('\n');
  }

  async function sanityFetch(query) {
    try {
      var res = await fetch(API_BASE + '?query=' + encodeURIComponent(query));
      if (!res.ok) return null;
      var json = await res.json();
      return json.result != null ? json.result : null;
    } catch (e) {
      return null;
    }
  }

  window.CLVCH_SANITY = {
    imageUrl:            imageUrl,
    portableTextToHtml:  portableTextToHtml,
    fetch:               sanityFetch,
  };
})();
