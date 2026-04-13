import type { EmitDomainEvents } from '@/modules/core/domain-base/events/domain-event.types';
import mitt, { type EventHandlerMap } from 'mitt';

export function mittAsync(all?: EventHandlerMap<EmitDomainEvents>) {
  const emitter = mitt<EmitDomainEvents>(all);

  emitter.emitAsync = async function (type: keyof EmitDomainEvents, e: any) {
    const handlersType = this.all.get(type);
    // @ts-expect-error Ignore typecheck
    if (handlersType) for (const ht of handlersType) await ht(e);
    const handlersWildcard = this.all.get('*');
    if (handlersWildcard) for (const hw of handlersWildcard) await hw(type, e);
  };
  return emitter;
}
