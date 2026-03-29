async function foo() {
  const p = Promise.resolve({});
  console.log(p.auth.getUser());
}
foo().catch(e => console.log(e.message));
