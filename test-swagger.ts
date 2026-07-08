import { getApiDocs } from './utils/swagger';

async function test() {
  const spec = await getApiDocs();
  console.log(JSON.stringify(spec, null, 2));
}

test();
