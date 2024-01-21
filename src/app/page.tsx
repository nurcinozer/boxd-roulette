export default async function Home() {
  const response = await fetch(`${process.env.URL}/api/movie?username=nurcin`);
  const data = await response.json();
  console.log(data);

  return (
    <div>
      <h1>Home</h1>
    </div>
  );
}
