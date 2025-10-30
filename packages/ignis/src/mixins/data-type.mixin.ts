import { property } from "@/decorators/model.decorators";
import type { ClassType } from "@/common/types";

/**
 * Data type mixin - adds polymorphic type fields
 * Matches Loopback 4's DataTypeMixin
 */
export function DataTypeMixin<T extends ClassType<any>>(Base: T) {
  class DataTypeModel extends Base {
    @property({
      type: "string",
      required: true,
      description: "Entity type discriminator",
    })
    type: string;

    @property({
      type: "string",
      description: "Entity category",
    })
    category?: string;

    @property({
      type: "string",
      description: "Entity scheme",
    })
    scheme?: string;

    @property({
      type: "array",
      itemType: "string",
      description: "Entity tags",
    })
    tags?: string[];

    @property({
      type: "object",
      description: "Additional metadata",
    })
    metadata?: Record<string, any>;
  }

  return DataTypeModel;
}
