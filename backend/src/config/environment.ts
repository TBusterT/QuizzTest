export interface Environment {
  PORT: number;
  FRONTEND_URL: string;
  DATABASE_URL: string;
}

function requiredString(config: Record<string, unknown>, name: string): string {
  const value = config[name];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} is required. Check backend/.env.`);
  }

  return value.trim();
}

function parseUrl(value: string, name: string): URL {
  try {
    return new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }
}

export function validateEnvironment(
  config: Record<string, unknown>,
): Environment {
  const portValue = requiredString(config, 'PORT');
  const port = Number(portValue);

  if (
    !/^\d+$/.test(portValue) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  const frontendUrl = parseUrl(
    requiredString(config, 'FRONTEND_URL'),
    'FRONTEND_URL',
  );

  if (
    !['http:', 'https:'].includes(frontendUrl.protocol) ||
    frontendUrl.username ||
    frontendUrl.password ||
    frontendUrl.pathname !== '/' ||
    frontendUrl.search ||
    frontendUrl.hash
  ) {
    throw new Error(
      'FRONTEND_URL must be an HTTP(S) origin, such as http://localhost:3000.',
    );
  }

  const databaseUrlValue = requiredString(config, 'DATABASE_URL');
  const databaseUrl = parseUrl(databaseUrlValue, 'DATABASE_URL');

  if (
    !['postgres:', 'postgresql:'].includes(databaseUrl.protocol) ||
    !databaseUrl.hostname ||
    databaseUrl.pathname.length < 2
  ) {
    throw new Error(
      'DATABASE_URL must be a PostgreSQL connection URL with a database name.',
    );
  }

  return {
    PORT: port,
    FRONTEND_URL: frontendUrl.origin,
    DATABASE_URL: databaseUrlValue,
  };
}
