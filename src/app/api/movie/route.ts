import * as cheerio from 'cheerio';

const fetchPage = async (url: string) => {
  try {
    const res = await fetch(url);
    const html = await res.text();

    if (!res.ok) {
      return new Response('An error occurred', { status: 500 });
    }

    const $ = cheerio.load(html);
    const moviePosters = $('li.poster-container>div.poster');

    const movies: { name: string; path: string }[] = [];

    moviePosters.each((_, element) => {
      const path = $(element).attr('data-film-slug');
      const name = $(element).find('img').attr('alt');
      if (!path || !name) {
        console.log('No path or name found');
        return;
      }
      movies.push({ name, path });
    });

    return movies;
  } catch (error) {
    return new Response('An error occurred', { status: 500 });
  }
};

const fetchAllMovies = async () => {
  try {
    const res = await fetch('https://letterboxd.com/nurcin/watchlist');
    const html = await res.text();

    if (!res.ok) {
      return new Response('An error occurred', { status: 500 });
    }

    const $ = cheerio.load(html);
    const pages = parseInt($('div.pagination ul').children('li').last().text());

    if (!pages) {
      const movies = await fetchPage(
        'https://letterboxd.com/nurcin/watchlist/page/1'
      );
      if (!movies) {
        return new Response('An error occurred', { status: 500 });
      }
      return movies;
    }

    if (pages > 100) {
      return new Response('Too many pages', { status: 500 });
    }

    const allPages = await Promise.all(
      Array.from({ length: pages }, (_, i) =>
        fetchPage('https://letterboxd.com/nurcin/watchlist/page/' + (i + 1))
      )
    );

    console.log('All pages movies: ', allPages.flat().length);

    return allPages.flat();
  } catch (error) {
    return new Response('An error occurred', { status: 500 });
  }
};

export async function GET() {
  const movies = await fetchAllMovies();

  if (!movies) {
    return new Response('An error occurred', { status: 500 });
  }

  return new Response(JSON.stringify(movies), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
