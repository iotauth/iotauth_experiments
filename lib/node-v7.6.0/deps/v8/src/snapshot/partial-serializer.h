// Copyright 2016 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef V8_SNAPSHOT_PARTIAL_SERIALIZER_H_
#define V8_SNAPSHOT_PARTIAL_SERIALIZER_H_

#include "src/address-map.h"
#include "src/snapshot/serializer.h"

namespace v8 {
namespace internal {

class StartupSerializer;

class PartialSerializer : public Serializer {
 public:
  PartialSerializer(Isolate* isolate, StartupSerializer* startup_serializer);

  ~PartialSerializer() override;

  // Serialize the objects reachable from a single object pointer.
  void Serialize(Object** o);

 private:
  void SerializeObject(HeapObject* o, HowToCode how_to_code,
                       WhereToPoint where_to_point, int skip) override;

  bool ShouldBeInThePartialSnapshotCache(HeapObject* o);

  StartupSerializer* startup_serializer_;
  DISALLOW_COPY_AND_ASSIGN(PartialSerializer);
};

}  // namespace internal
}  // namespace v8

#endif  // V8_SNAPSHOT_PARTIAL_SERIALIZER_H_
