const z = require('zod')

const movieSchema = z.object({
    title: z.string({
      invalid_type_error: 'Movie title must be string.',
      required_error: 'Movie title is required.'
    }),
    genre: z.array(
      z.enum(['Action', 'Adventura', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Trhiler', 'Sci.Fi', 'Crime']),{
        required_error: 'Movie genre is required',
        invalid_type_error: 'Movie genre must be an array of enum Genre'
      }
    ),
    year: z.number().int().positive().min(1900).max(2024),
    director: z.string(),
    duration: z.number().int().positive(),
    rate: z.number().min(0).max(10).default(5),
    poster: z.string().url({
      message: 'poster must be a valid URL'
    })
  })   

function validateMovie(input) {
  return movieSchema.safeParse(input) //en vez de parse usamos safeParse porque Devuelve un objeto result que va a decir si hay un error o hay datos y con un if podremos verlo
}

function validatePartialMovie(input){
  return  movieSchema.partial().safeParse(input) //El parcial convierte a todas las validaciones en opcionales, si esta la valida y sino, nada.
}

module.exports = {
  validateMovie, validatePartialMovie
}
