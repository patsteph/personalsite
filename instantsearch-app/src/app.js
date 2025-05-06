const { algoliasearch, instantsearch } = window;

const searchClient = algoliasearch('BIG74MXLH5', '7a9ce8a20d3d485a2f7d0979acd0a6a1');

const search = instantsearch({
  indexName: 'algoSearch',
  searchClient,
  future: { preserveSharedStateOnUnmount: true },
  
});


search.addWidgets([
  instantsearch.widgets.searchBox({
    container: '#searchbox',
  }),
  instantsearch.widgets.hits({
    container: '#hits',
    templates: {
      item: (hit, { html, components }) => html`
<article>
  <img src=${ hit.imageLinks.thumbnail } alt=${ hit.title } />
  <div>
    <h1>${components.Highlight({hit, attribute: "title"})}</h1>
    <p>${components.Highlight({hit, attribute: "categories.0"})}</p>
    <p>${components.Highlight({hit, attribute: "status"})}</p>
  </div>
</article>
`,
    },
  }),
  instantsearch.widgets.configure({
    hitsPerPage: 8,
  }),
  instantsearch.widgets.pagination({
    container: '#pagination',
  }),
]);

search.start();

