import { INITIAL_PAGE, LETTERBOXD_BASE_URL } from '@/app/constants';
import { Movie } from '@/app/types';
import * as cheerio from 'cheerio';
import { NextRequest } from 'next/server';

const fetchPage = async (url: string) => {
  try {
    const res = await fetch(url);
    const html = await res.text();

    if (!res.ok) {
      return new Response('An error occurred', { status: 500 });
    }

    const $ = cheerio.load(html);
    const moviePosters = $('li.poster-container>div.poster');

    const movies: Movie[] = [];

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

const fetchAllMovies = async (username: string) => {
  try {
    const res = await fetch(`${LETTERBOXD_BASE_URL}/${username}/watchlist`);
    const html = await res.text();

    if (!res.ok) {
      return new Response('An error occurred', { status: 500 });
    }

    const $ = cheerio.load(html);
    const pages = parseInt($('div.pagination ul').children('li').last().text());

    if (!pages) {
      const movies = await fetchPage(
        `${LETTERBOXD_BASE_URL}/${username}/watchlist/page/${INITIAL_PAGE}`
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
        fetchPage(
          `${LETTERBOXD_BASE_URL}/${username}/watchlist/page/` + (i + 1)
        )
      )
    );

    // console.log('All pages movies: ', allPages.flat().length);

    return allPages.flat();
  } catch (error) {
    return new Response('An error occurred', { status: 500 });
  }
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username'); // query is "username" for /api/movie?username=...

  if (!username) {
    return new Response('An error occurred', { status: 500 });
  }

  const movies = await fetchAllMovies(username);

  if (!movies) {
    return new Response('An error occurred', { status: 500 });
  }

  return new Response(JSON.stringify(movies), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
