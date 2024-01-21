export default async function Home() {
  const response = await fetch(`${process.env.URL}/api/movie`);
  const data = await response.json();

  return (
    <div>
      <h1>Home</h1>
    </div>
  );
}
