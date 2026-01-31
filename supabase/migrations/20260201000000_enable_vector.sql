-- Enable pgvector extension
create extension if not exists vector;

-- Add embedding column to news table (768 dimensions for Vertex text-embedding-004)
alter table news add column if not exists embedding vector(768);

-- Create index for faster search (Cosine Similarity)
create index if not exists news_embedding_idx on news using hnsw (embedding vector_cosine_ops);

-- Create function for similarity search
create or replace function match_news (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    news.id,
    news.content,
    1 - (news.embedding <=> query_embedding) as similarity
  from news
  where 1 - (news.embedding <=> query_embedding) > match_threshold
  order by news.embedding <=> query_embedding
  limit match_count;
end;
$$;
