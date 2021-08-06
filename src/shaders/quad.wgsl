[[group(0), binding(0)]] var my_sampler: sampler;
[[group(1), binding(0)]] var in_texture: texture_2d<f32>;

struct VertexOutput {
  [[builtin(position)]] pos: vec4<f32>;
  [[location(0)]] frag_uv: vec2<f32>;
};

[[stage(vertex)]]
fn vert_main([[builtin(vertex_index)]] index: u32) -> VertexOutput {
  var pos = array<vec2<f32>, 6>(
    vec2<f32>( 1.0,  1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0,  1.0),
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(-1.0,  1.0)
  );

  var uv = array<vec2<f32>, 6>(
    vec2<f32>(1.0, 0.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(0.0, 0.0)
  );

  return VertexOutput(
    vec4<f32>(pos[index], 0.0, 1.0),
    uv[index]
  );
}

[[stage(fragment)]]
fn frag_main([[location(0)]] frag_uv : vec2<f32>) -> [[location(0)]] vec4<f32> {
  return textureSample(in_texture, my_sampler, frag_uv);
}
