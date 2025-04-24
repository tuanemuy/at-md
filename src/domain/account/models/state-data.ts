import { z } from "zod";

export const stateDataSchema = z.object({
  state: z.string().nonempty(),
});

export type StateData = z.infer<typeof stateDataSchema>;
