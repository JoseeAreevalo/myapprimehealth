-- "Aprendizaje" section: short knowledge-base notes any user can read, super_admin can manage.
CREATE TABLE IF NOT EXISTS learning_notes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_notes_sort_order ON learning_notes(sort_order, id);

INSERT INTO learning_notes (title, body, sort_order) VALUES
  ('¿Qué es el RIR?', 'RIR significa "Repeticiones en Reserva" (Reps In Reserve). Indica cuántas repeticiones más podrías haber hecho antes de llegar al fallo muscular en una serie. Un RIR de 2 significa que, al terminar la serie, podrías haber hecho 2 repeticiones más. Se usa para controlar la intensidad del entrenamiento sin necesidad de llegar siempre al fallo.', 0),
  ('¿Qué son las series y las repeticiones?', 'Una repetición es un movimiento completo de un ejercicio (por ejemplo, una sentadilla completa). Una serie es un grupo de repeticiones realizadas seguidas, sin descanso. Por ejemplo, "3 series de 10 repeticiones" significa hacer 10 repeticiones, descansar, y repetir el proceso 3 veces en total.', 1),
  ('Importancia del entrenamiento de baja intensidad', 'El entrenamiento de baja intensidad (como caminar o cardio suave) mejora la recuperación, la salud cardiovascular y ayuda a quemar calorías sin generar demasiada fatiga acumulada. Es un complemento clave al entrenamiento de fuerza, ya que permite entrenar más seguido sin sobrecargar el sistema nervioso.', 2),
  ('¿Qué es la sobrecarga progresiva?', 'La sobrecarga progresiva es el principio de ir aumentando gradualmente la demanda sobre el músculo con el tiempo (más peso, más repeticiones, más series, o mejor técnica). Es el mecanismo principal detrás del crecimiento muscular y la mejora de la fuerza: sin progresión, el cuerpo deja de adaptarse.', 3),
  ('Importancia de la nutrición en la salud', 'La nutrición es la base de la salud física y mental: influye en la energía diaria, la recuperación muscular, el sistema inmune y el estado de ánimo. Una alimentación balanceada, ajustada a tus objetivos y actividad, es tan importante como el ejercicio mismo para lograr resultados sostenibles.', 4),
  ('Importancia de los macronutrientes', 'Los macronutrientes (proteínas, carbohidratos y grasas) son los nutrientes que aportan energía al cuerpo. Las proteínas ayudan a reparar y construir músculo, los carbohidratos son la principal fuente de energía para entrenar, y las grasas son esenciales para la producción hormonal. Balancear los tres según tus metas es clave para progresar.', 5),
  ('¿Qué es la tensión mecánica?', 'La tensión mecánica es la fuerza que un músculo debe generar para mover o resistir una carga. Es uno de los principales estímulos que provocan el crecimiento muscular (hipertrofia): entre más tensión mecánica se aplique de forma progresiva y controlada, mayor es el estímulo para que el músculo se adapte y crezca.', 6);
