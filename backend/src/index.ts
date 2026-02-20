import fastify from "api";

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// Start the API server
fastify.listen({ port: 3001 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
