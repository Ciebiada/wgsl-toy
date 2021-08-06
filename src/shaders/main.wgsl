[[block]] struct Params {
  width: u32;
  height: u32;
  frame: u32;
};

[[group(0), binding(0)]] var<uniform> params: Params;
[[group(0), binding(1)]] var my_sampler: sampler;
[[group(1), binding(0)]] var in_texture: texture_2d<f32>;
[[group(1), binding(1)]] var out_texture: texture_storage_2d<rgba8unorm, write>;

[[stage(compute), workgroup_size(8, 8)]]
fn main(
  [[builtin(workgroup_id)]] workgroup_id: vec3<u32>,
  [[builtin(local_invocation_id)]] local_id: vec3<u32>,
) {
  let pixel = workgroup_id.xy * vec2<u32>(8u, 8u) + local_id.xy;

  let uv = vec2<f32>(
    f32(pixel.x) / f32(params.width),
    f32(pixel.y) / f32(params.height)
  );

  let last_frame_color = textureSampleLevel(in_texture, my_sampler, uv, 0.0).rgb;

  let time = f32(params.frame) * 0.02;

  let color = 0.5 + 0.5 * cos(time + uv.xyx + vec3<f32>(0.0, 2.0, 4.0));

  textureStore(out_texture, vec2<i32>(pixel), vec4<f32>(color, 1.0));
}
